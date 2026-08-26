import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const ENV_PATH = new URL('./.env.local', import.meta.url);
const BACKUP_ROOT = new URL('./.supabase-migration-backups/', import.meta.url);
const LATEST_POINTER = new URL('latest-env-cleanup-backup.txt', BACKUP_ROOT);

const TO_REMOVE = [
  'OLD_SUPABASE_URL',
  'OLD_SUPABASE_ANON_KEY',
  'OLD_SUPABASE_SERVICE_ROLE_KEY',
  'OLD_CLOUDINARY_CLOUD_NAME',
  'OLD_CLOUDINARY_API_KEY',
  'OLD_CLOUDINARY_API_SECRET',
  'NEW_SUPABASE_URL',
  'NEW_SUPABASE_ANON_KEY',
  'NEW_SUPABASE_SERVICE_ROLE_KEY',
  'NEW_CLOUDINARY_CLOUD_NAME',
  'NEW_CLOUDINARY_API_KEY',
  'NEW_CLOUDINARY_API_SECRET',
];

async function cleanup() {
  const current = await readFile(ENV_PATH, 'utf8');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = new URL(`env-cleanup-${timestamp}/`, BACKUP_ROOT);
  const backup = new URL('.env.local.before-cleanup', directory);
  await mkdir(directory, { recursive: true });
  await copyFile(ENV_PATH, backup);
  await writeFile(LATEST_POINTER, backup.pathname, { mode: 0o600 });

  const lines = current.split(/\r?\n/);
  const kept = [];
  const removed = [];
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match && TO_REMOVE.includes(match[1])) {
      removed.push(match[1]);
      continue;
    }
    kept.push(line);
  }

  await writeFile(ENV_PATH, kept.join('\n'), { mode: 0o600 });
  console.log(`Removed ${removed.length} variables from .env.local:`);
  for (const name of removed) console.log(`  - ${name}`);
  console.log(`\nBackup saved: .supabase-migration-backups/env-cleanup-${timestamp}/.env.local.before-cleanup`);
}

async function rollback() {
  const backupPath = (await readFile(LATEST_POINTER, 'utf8')).trim();
  if (!backupPath) throw new Error('No cleanup backup pointer found.');
  await copyFile(backupPath, ENV_PATH);
  console.log('Environment rolled back to pre-cleanup values.');
}

const mode = process.argv[2];
if (mode === '--apply') await cleanup();
else if (mode === '--rollback') await rollback();
else throw new Error('Use --apply or --rollback.');
