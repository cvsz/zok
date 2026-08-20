import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { pbkdf2Sync } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

const password = 'test-password-1234';
const testDirectory = await mkdtemp(path.join(os.tmpdir(), 'zok-api-'));
const databaseFile = path.join(testDirectory, 'db.json');
const salt = 'test-salt-for-zok';
const passwordHash = `pbkdf2_sha256$310000$${salt}$${pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('base64url')}`;

process.env.NODE_ENV = 'test';
process.env.ZOK_NO_LISTEN = 'true';
process.env.ZOK_DB_FILE = databaseFile;
process.env.ZOK_ADMIN_EMAIL = 'admin@example.test';
process.env.ZOK_ADMIN_PASSWORD_HASH = passwordHash;
process.env.ZOK_ALLOWED_ORIGINS = 'http://127.0.0.1:5175';

const { startServer } = await import('../server.js');
const server = startServer(0);
await new Promise(resolve => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;

function cookieValue(setCookieHeader, name) {
  const match = setCookieHeader.match(new RegExp(`${name}=([^;,]+)`));
  assert.ok(match, `Expected ${name} cookie`);
  return match[1];
}

test('API release hardening protects and validates the real request path', async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', service: 'zok-api', environment: 'test' });
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.headers.get('x-frame-options'), 'DENY');
  assert.equal(health.headers.get('cache-control'), 'no-store');

  const blockedOrigin = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.equal(blockedOrigin.status, 403);

  const malformedJson = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email":',
  });
  assert.equal(malformedJson.status, 400);
  assert.deepEqual(await malformedJson.json(), { error: 'Request body must be valid JSON' });

  const unauthenticated = await fetch(`${baseUrl}/api/chats`);
  assert.equal(unauthenticated.status, 401);

  const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'wrong-password' }),
  });
  assert.equal(badLogin.status, 401);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password }),
  });
  assert.equal(login.status, 200);
  assert.deepEqual((await login.json()).user, { email: 'admin@example.test', role: 'owner' });

  const setCookie = login.headers.get('set-cookie');
  assert.ok(setCookie);
  const cookies = `zok_session=${cookieValue(setCookie, 'zok_session')}; zok_csrf=${cookieValue(setCookie, 'zok_csrf')}`;
  const authenticatedHeaders = { Cookie: cookies };

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: authenticatedHeaders });
  assert.equal(me.status, 200);
  assert.deepEqual((await me.json()).user, { email: 'admin@example.test', role: 'owner' });

  const chats = await fetch(`${baseUrl}/api/chats`, { headers: authenticatedHeaders });
  assert.equal(chats.status, 200);
  assert.ok(Array.isArray(await chats.json()));

  const malformedCookie = await fetch(`${baseUrl}/api/chats`, {
    headers: { Cookie: 'zok_session=%E0%A4%A' },
  });
  assert.equal(malformedCookie.status, 401);

  const csrf = cookieValue(setCookie, 'zok_csrf');
  const unverifiedIntegration = await fetch(`${baseUrl}/api/integrations/shopify/toggle`, {
    method: 'POST',
    headers: { ...authenticatedHeaders, 'X-CSRF-Token': csrf },
  });
  assert.equal(unverifiedIntegration.status, 409);

  const missingCsrf = await fetch(`${baseUrl}/api/chats/1/tags`, {
    method: 'POST',
    headers: { ...authenticatedHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: ['verified'] }),
  });
  assert.equal(missingCsrf.status, 403);

  const update = await fetch(`${baseUrl}/api/chats/1/tags`, {
    method: 'POST',
    headers: {
      ...authenticatedHeaders,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    },
    body: JSON.stringify({ tags: ['verified', 'release-test'] }),
  });
  assert.equal(update.status, 200);
  assert.deepEqual((await update.json()).details.tags, ['verified', 'release-test']);

  const invalidId = await fetch(`${baseUrl}/api/chats/not-an-id/tags`, {
    method: 'POST',
    headers: {
      ...authenticatedHeaders,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    },
    body: JSON.stringify({ tags: [] }),
  });
  assert.equal(invalidId.status, 400);

  const persisted = JSON.parse(await readFile(databaseFile, 'utf8'));
  assert.deepEqual(persisted.chats[0].details.tags, ['verified', 'release-test']);

  const concurrentCampaigns = await Promise.all(
    Array.from({ length: 20 }, (_, index) => fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        ...authenticatedHeaders,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      },
      body: JSON.stringify({
        name: `Concurrent release check ${index}`,
        channel: 'line',
        target: 'release-test',
      }),
    })),
  );
  assert.ok(concurrentCampaigns.every(response => response.status === 201));
  const afterConcurrentWrites = JSON.parse(await readFile(databaseFile, 'utf8'));
  assert.equal(afterConcurrentWrites.campaigns.length, 23);
  assert.equal((await readdir(testDirectory)).filter(name => name.endsWith('.tmp')).length, 0);

  await writeFile(databaseFile, '{"broken": true', 'utf8');
  const degradedHealth = await fetch(`${baseUrl}/api/health`);
  assert.equal(degradedHealth.status, 503);
  assert.deepEqual(await degradedHealth.json(), {
    status: 'degraded',
    service: 'zok-api',
    environment: 'test',
  });
  assert.equal(await readFile(databaseFile, 'utf8'), '{"broken": true');
  await writeFile(databaseFile, JSON.stringify(afterConcurrentWrites, null, 2), 'utf8');

  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { ...authenticatedHeaders, 'X-CSRF-Token': csrf },
  });
  assert.equal(logout.status, 204);

  const afterLogout = await fetch(`${baseUrl}/api/chats`, { headers: authenticatedHeaders });
  assert.equal(afterLogout.status, 401);
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  await rm(testDirectory, { recursive: true, force: true });
});