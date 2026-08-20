import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInitialMigration,
  listPublicTables,
  rollbackInitialMigration,
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

  // Prove the migration remains replayable after a complete rollback.
  await applyInitialMigration(databaseUrl);
  const afterReplay = await listPublicTables(databaseUrl);
  for (const table of expectedTables) {
    assert.ok(afterReplay.includes(table), `expected ${table} after replayed up migration`);
  }

  await rollbackInitialMigration(databaseUrl);
});
