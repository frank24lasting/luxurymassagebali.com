import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

const ENV_PATH = new URL('./.env.local', import.meta.url);
const BACKUP_ROOT = new URL('./.supabase-migration-backups/', import.meta.url);
const LATEST_POINTER = new URL('latest-cloudinary-backup.txt', BACKUP_ROOT);

const replacements = {
  VITE_CLOUDINARY_CLOUD_NAME: process.env.NEW_CLOUDINARY_CLOUD_NAME,
  VITE_CLOUDINARY_UPLOAD_PRESET: 'luxury-massage-bali-upload',
  CLOUDINARY_API_KEY: process.env.NEW_CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.NEW_CLOUDINARY_API_SECRET,
};

function replaceVariables(content, values) {
  const lines = content.split(/\r?\n/);
  const seen = new Set();
  const next = lines.map((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!match || !(match[1] in values)) return line;
    seen.add(match[1]);
    return `${match[1]}=${values[match[1]]}`;
  });
  for (const [name, value] of Object.entries(values)) {
    if (!seen.has(name)) next.push(`${name}=${value}`);
  }
  return next.join('\n');
}

async function apply() {
  for (const [name, value] of Object.entries(replacements)) {
    if (!value) throw new Error(`Missing ${name.replace(/^(VITE_)?/, 'NEW_')}.`);
  }
  if (!replacements.VITE_CLOUDINARY_CLOUD_NAME) {
    throw new Error('Safety check failed: NEW_CLOUDINARY_CLOUD_NAME is empty.');
  }

  const current = await readFile(ENV_PATH, 'utf8');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = new URL(`cloudinary-cutover-${timestamp}/`, BACKUP_ROOT);
  const backup = new URL('.env.local.before-cloudinary-cutover', directory);
  await mkdir(directory, { recursive: true });
  await copyFile(ENV_PATH, backup);
  await writeFile(LATEST_POINTER, backup.pathname, { mode: 0o600 });

  const updated = replaceVariables(current, replacements);
  await writeFile(ENV_PATH, updated, { mode: 0o600 });
  console.log(`Cloudinary cutover applied to cloud ${replacements.VITE_CLOUDINARY_CLOUD_NAME}.`);
  console.log(`Rollback backup saved under .supabase-migration-backups/cloudinary-cutover-${timestamp}/.`);
}

async function rollback() {
  const backupPath = (await readFile(LATEST_POINTER, 'utf8')).trim();
  if (!backupPath) throw new Error('No environment backup pointer found.');
  await copyFile(backupPath, ENV_PATH);
  console.log('Cloudinary environment rolled back to pre-cutover values.');
}

const mode = process.argv[2];
if (mode === '--apply') await apply();
else if (mode === '--rollback') await rollback();
else throw new Error('Use --apply or --rollback.');
