import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInitialMigration,
  applyTenantIsolationMigration,
  executeSql,
  listPublicTables,
  queryScalar,
  rollbackInitialMigration,
  rollbackTenantIsolationMigration,
} from '../scripts/postgres-migrations.js';

const databaseUrl = process.env.ZOK_POSTGRES_TEST_URL;

const expectedTables = [
  'audit_events',
  'campaigns',
  'consent_records',
  'contacts',
  'conversations',
  'integrations',
  'messages',
  'roles',
  'sessions',
  'tenants',
  'user_roles',
  'users',
];

test('initial PostgreSQL migration applies and rolls back against a real server', {
  skip: databaseUrl ? false : 'ZOK_POSTGRES_TEST_URL is not configured',
}, async () => {
  await applyInitialMigration(databaseUrl);

  const afterUp = await listPublicTables(databaseUrl);
  for (const table of expectedTables) {
    assert.ok(afterUp.includes(table), `expected ${table} after up migration`);
  }

  await rollbackInitialMigration(databaseUrl);
  const afterDown = await listPublicTables(databaseUrl);
  for (const table of expectedTables) {
    assert.ok(!afterDown.includes(table), `expected ${table} to be removed by down migration`);
  }

  await applyInitialMigration(databaseUrl);
  const afterReplay = await listPublicTables(databaseUrl);
  for (const table of expectedTables) {
    assert.ok(afterReplay.includes(table), `expected ${table} after replayed up migration`);
  }

  await rollbackInitialMigration(databaseUrl);
});

test('PostgreSQL tenant isolation denies cross-tenant reads and writes', {
  skip: databaseUrl ? false : 'ZOK_POSTGRES_TEST_URL is not configured',
}, async () => {
  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const appPassword = 'zok-rls-test-password';
  const appUrl = new URL(databaseUrl);
  appUrl.username = 'zok_app_test';
  appUrl.password = appPassword;

  await applyInitialMigration(databaseUrl);
  try {
    await executeSql(databaseUrl, `
      INSERT INTO tenants (id, slug, name) VALUES
        ('${tenantA}', 'tenant-a', 'Tenant A'),
        ('${tenantB}', 'tenant-b', 'Tenant B');
      CREATE ROLE zok_app_test LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOBYPASSRLS;
      GRANT USAGE ON SCHEMA public TO zok_app_test;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO zok_app_test;
    `);
    await applyTenantIsolationMigration(databaseUrl);

    await executeSql(appUrl.toString(), `
      SET app.tenant_id = '${tenantA}';
      INSERT INTO contacts (tenant_id, name) VALUES ('${tenantA}', 'Contact A');
    `);
    await executeSql(appUrl.toString(), `
      SET app.tenant_id = '${tenantB}';
      INSERT INTO contacts (tenant_id, name) VALUES ('${tenantB}', 'Contact B');
    `);

    assert.equal(await queryScalar(appUrl.toString(), `
      SET app.tenant_id = '${tenantA}';
      SELECT count(*) FROM contacts;
    `), '1');
    assert.equal(await queryScalar(appUrl.toString(), `
      SET app.tenant_id = '${tenantB}';
      SELECT count(*) FROM contacts;
    `), '1');

    await assert.rejects(
      () => executeSql(appUrl.toString(), `
        SET app.tenant_id = '${tenantA}';
        INSERT INTO contacts (tenant_id, name) VALUES ('${tenantB}', 'Cross-tenant write');
      `),
      /row-level security policy/i,
    );

    assert.equal(await queryScalar(appUrl.toString(), `
      RESET app.tenant_id;
      SELECT count(*) FROM contacts;
    `), '0');
  } finally {
    await rollbackTenantIsolationMigration(databaseUrl).catch(() => undefined);
    await executeSql(databaseUrl, 'DROP ROLE IF EXISTS zok_app_test;').catch(() => undefined);
    await rollbackInitialMigration(databaseUrl);
  }
});
