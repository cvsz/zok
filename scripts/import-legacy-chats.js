import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPostgresPool, createPostgresStorage } from '../server/storage/postgres-storage.js';
import { importLegacyChats } from '../server/storage/postgres/legacy-chat-import.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const options = {
    dryRun: false,
    file: process.env.ZOK_DB_FILE || path.join(repoRoot, 'server', 'db.json'),
    tenantId: process.env.ZOK_ADMIN_TENANT_ID || '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--file' || arg === '--tenant-id') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === '--file') options.file = path.resolve(value);
      else options.tenantId = value;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const source = JSON.parse(await readFile(options.file, 'utf8'));
  if (!source || typeof source !== 'object' || Array.isArray(source) || !Array.isArray(source.chats)) {
    throw new TypeError('Legacy JSON source must contain a chats array');
  }

  if (options.dryRun) {
    const result = await importLegacyChats({
      chats: source.chats,
      tenantId: options.tenantId,
      dryRun: true,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const connectionString = (process.env.ZOK_POSTGRES_URL || '').trim();
  if (!connectionString) throw new Error('ZOK_POSTGRES_URL is required unless --dry-run is used');

  const pool = createPostgresPool({ connectionString });
  const storage = createPostgresStorage({ pool });
  try {
    const result = await importLegacyChats({
      chats: source.chats,
      tenantId: options.tenantId,
      storage,
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await storage.close();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
