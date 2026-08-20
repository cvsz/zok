import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInitialMigration,
  applyTenantIsolationMigration,
  executeSql,
  rollbackInitialMigration,
  rollbackTenantIsolationMigration,
} from '../scripts/postgres-migrations.js';
import { createPostgresPool, createPostgresStorage } from '../server/storage/postgres-storage.js';

const databaseUrl = process.env.ZOK_POSTGRES_TEST_URL;

test('real PostgreSQL pool enforces transaction-scoped tenant isolation', {
  skip: databaseUrl ? false : 'ZOK_POSTGRES_TEST_URL is not configured',
}, async () => {
  const tenantA = '99999999-9999-4999-8999-999999999999';
  const tenantB = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
  const appPassword = 'zok-real-pool-password';
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';
  const isolatedUrl = new URL(databaseUrl);
  isolatedUrl.pathname = '/zok_pool_integration_test';
  const appUrl = new URL(isolatedUrl);
  appUrl.username = 'zok_real_pool_test';
  appUrl.password = appPassword;

  await executeSql(adminUrl.toString(), 'DROP DATABASE IF EXISTS zok_pool_integration_test WITH (FORCE);');
  await executeSql(adminUrl.toString(), 'CREATE DATABASE zok_pool_integration_test;');
  await applyInitialMigration(isolatedUrl.toString());
  try {
    await executeSql(isolatedUrl.toString(), `
      INSERT INTO tenants (id, slug, name) VALUES
        ('${tenantA}', 'real-pool-a', 'Real Pool A'),
        ('${tenantB}', 'real-pool-b', 'Real Pool B');
      CREATE ROLE zok_real_pool_test LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOBYPASSRLS;
      GRANT USAGE ON SCHEMA public TO zok_real_pool_test;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO zok_real_pool_test;
    `);
    await applyTenantIsolationMigration(isolatedUrl.toString());

    const pool = createPostgresPool({ connectionString: appUrl.toString(), max: 2 });
    const storage = createPostgresStorage({ pool });
    try {
      await storage.withTenantTransaction(tenantA, async tx => {
        await tx.query('INSERT INTO contacts (tenant_id, name) VALUES ($1, $2)', [tenantA, 'Visible A']);
      });

      const countA = await storage.withTenantTransaction(tenantA, async tx => {
        const result = await tx.query('SELECT count(*)::int AS count FROM contacts');
        return result.rows[0].count;
      });
      assert.equal(countA, 1);

      const countB = await storage.withTenantTransaction(tenantB, async tx => {
        const result = await tx.query('SELECT count(*)::int AS count FROM contacts');
        return result.rows[0].count;
      });
      assert.equal(countB, 0);

      await assert.rejects(
        () => storage.withTenantTransaction(tenantA, tx =>
          tx.query('INSERT INTO contacts (tenant_id, name) VALUES ($1, $2)', [tenantB, 'Cross tenant'])),
        /row-level security policy/i,
      );
    } finally {
      await storage.close();
    }
  } finally {
    await rollbackTenantIsolationMigration(isolatedUrl.toString()).catch(() => undefined);
    await rollbackInitialMigration(isolatedUrl.toString()).catch(() => undefined);
    await executeSql(adminUrl.toString(), 'DROP DATABASE IF EXISTS zok_pool_integration_test WITH (FORCE);').catch(() => undefined);
    await executeSql(adminUrl.toString(), 'DROP ROLE IF EXISTS zok_real_pool_test;').catch(() => undefined);
  }
});
