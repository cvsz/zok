import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInitialMigration,
  applyTenantIsolationMigration,
  executeSql,
  rollbackTenantIsolationMigration,
  rollbackInitialMigration,
} from '../scripts/postgres-migrations.js';
import { createPostgresStorage } from '../server/storage/postgres-storage.js';

const databaseUrl = process.env.ZOK_POSTGRES_TEST_URL;

test('PostgreSQL storage binds tenant context inside a transaction and releases pooled clients', {
  skip: databaseUrl ? false : 'ZOK_POSTGRES_TEST_URL is not configured',
}, async () => {
  const tenantA = '66666666-6666-4666-8666-666666666666';
  const tenantB = '77777777-7777-4777-8777-777777777777';
  const appPassword = 'zok-storage-test-password';
  const appUrl = new URL(databaseUrl);
  appUrl.username = 'zok_storage_test';
  appUrl.password = appPassword;

  await applyInitialMigration(databaseUrl);
  try {
    await executeSql(databaseUrl, `
      INSERT INTO tenants (id, slug, name) VALUES
        ('${tenantA}', 'storage-a', 'Storage A'),
        ('${tenantB}', 'storage-b', 'Storage B');
      CREATE ROLE zok_storage_test LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOBYPASSRLS;
      GRANT USAGE ON SCHEMA public TO zok_storage_test;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO zok_storage_test;
    `);
    await applyTenantIsolationMigration(databaseUrl);

    const storage = createPostgresStorage({ connectionString: appUrl.toString(), max: 2 });
    try {
      await storage.withTenantTransaction(tenantA, async tx => {
        await tx.query('INSERT INTO contacts (tenant_id, name) VALUES ($1, $2)', [tenantA, 'Tenant A contact']);
        const visible = await tx.query('SELECT count(*)::int AS count FROM contacts');
        assert.equal(visible.rows[0].count, 1);
        await assert.rejects(
          () => tx.query('INSERT INTO contacts (tenant_id, name) VALUES ($1, $2)', [tenantB, 'Cross tenant']),
          /row-level security policy/i,
        );
      });

      await assert.rejects(
        () => storage.withTenantTransaction('', async () => undefined),
        /tenantId is required/i,
      );

      const tenantBCount = await storage.withTenantTransaction(tenantB, async tx => {
        const result = await tx.query('SELECT count(*)::int AS count FROM contacts');
        return result.rows[0].count;
      });
      assert.equal(tenantBCount, 0);
    } finally {
      await storage.close();
    }
  } finally {
    await rollbackTenantIsolationMigration(databaseUrl).catch(() => undefined);
    await executeSql(databaseUrl, 'DROP ROLE IF EXISTS zok_storage_test;').catch(() => undefined);
    await rollbackInitialMigration(databaseUrl);
  }
});

test('PostgreSQL storage rolls back failed tenant transactions', {
  skip: databaseUrl ? false : 'ZOK_POSTGRES_TEST_URL is not configured',
}, async () => {
  const tenantId = '88888888-8888-4888-8888-888888888888';
  const appPassword = 'zok-storage-rollback-password';
  const appUrl = new URL(databaseUrl);
  appUrl.username = 'zok_storage_rollback_test';
  appUrl.password = appPassword;

  await applyInitialMigration(databaseUrl);
  try {
    await executeSql(databaseUrl, `
      INSERT INTO tenants (id, slug, name) VALUES ('${tenantId}', 'storage-rollback', 'Storage Rollback');
      CREATE ROLE zok_storage_rollback_test LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOBYPASSRLS;
      GRANT USAGE ON SCHEMA public TO zok_storage_rollback_test;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO zok_storage_rollback_test;
    `);
    await applyTenantIsolationMigration(databaseUrl);

    const storage = createPostgresStorage({ connectionString: appUrl.toString(), max: 1 });
    try {
      await assert.rejects(
        () => storage.withTenantTransaction(tenantId, async tx => {
          await tx.query('INSERT INTO contacts (tenant_id, name) VALUES ($1, $2)', [tenantId, 'Must rollback']);
          throw new Error('force rollback');
        }),
        /force rollback/,
      );

      const count = await storage.withTenantTransaction(tenantId, async tx => {
        const result = await tx.query('SELECT count(*)::int AS count FROM contacts');
        return result.rows[0].count;
      });
      assert.equal(count, 0);
    } finally {
      await storage.close();
    }
  } finally {
    await rollbackTenantIsolationMigration(databaseUrl).catch(() => undefined);
    await executeSql(databaseUrl, 'DROP ROLE IF EXISTS zok_storage_rollback_test;').catch(() => undefined);
    await rollbackInitialMigration(databaseUrl);
  }
});
