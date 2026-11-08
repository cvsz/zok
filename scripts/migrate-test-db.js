import {
  applyInitialMigration,
  applyTenantIsolationMigration,
  applyRelationalIntegrityMigration,
  applySyncLogsMigration,
  applyRateLimitRecordsMigration,
  applyMetricsMigration,
  applyAiGovernedMigration,
  applySoftDeleteMigration,
  applyCommerceAttributionMigration,
  applyCampaignWorkersMigration,
  applySecurityMigration,
} from './postgres-migrations.js';

const databaseUrl = process.env.ZOK_POSTGRES_TEST_URL;
if (!databaseUrl) {
  process.exit(0);
}

try {
  await applyInitialMigration(databaseUrl);
  await applyTenantIsolationMigration(databaseUrl);
  await applyRelationalIntegrityMigration(databaseUrl);
  await applySyncLogsMigration(databaseUrl);
  await applyRateLimitRecordsMigration(databaseUrl);
  await applyMetricsMigration(databaseUrl);
  await applyAiGovernedMigration(databaseUrl);
  await applySoftDeleteMigration(databaseUrl);
  await applyCommerceAttributionMigration(databaseUrl);
  await applyCampaignWorkersMigration(databaseUrl);
  await applySecurityMigration(databaseUrl);
  console.log('PostgreSQL test schema migrated successfully');
} catch (error) {
  console.warn('Migration step warning (proceeding):', error.message);
}
