import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationDirectory = path.resolve(
  __dirname,
  '../server/storage/postgres/migrations',
);

async function runPsql(databaseUrl, args, input) {
  if (!databaseUrl || typeof databaseUrl !== 'string') {
    throw new Error('PostgreSQL database URL is required');
  }

  const { stdout } = await execFileAsync(
    'psql',
    [databaseUrl, '--no-psqlrc', '--set', 'ON_ERROR_STOP=1', ...args],
    {
      encoding: 'utf8',
      input,
      maxBuffer: 2 * 1024 * 1024,
    },
  );
  return stdout;
}

async function executeMigrationFile(databaseUrl, fileName) {
  const sql = await readFile(path.join(migrationDirectory, fileName), 'utf8');
  await runPsql(databaseUrl, ['--single-transaction', '--file', '-'], sql);
}

export async function applyInitialMigration(databaseUrl) {
  await executeMigrationFile(databaseUrl, '001_initial.up.sql');
}

export async function rollbackInitialMigration(databaseUrl) {
  await executeMigrationFile(databaseUrl, '001_initial.down.sql');
}

export async function listPublicTables(databaseUrl) {
  const stdout = await runPsql(databaseUrl, [
    '--tuples-only',
    '--no-align',
    '--command',
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;",
  ]);

  return stdout
    .split('\n')
    .map(value => value.trim())
    .filter(Boolean);
}
