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

export async function applyAllMigrations(databaseUrl) {
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
}
