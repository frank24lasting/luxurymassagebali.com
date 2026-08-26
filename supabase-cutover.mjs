import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

const TARGET_REF = 'sxpplbcswwnkepnapqrj';
const ENV_PATH = new URL('./.env.local', import.meta.url);
const BACKUP_ROOT = new URL('./.supabase-migration-backups/', import.meta.url);
const LATEST_POINTER = new URL('latest-env-backup.txt', BACKUP_ROOT);

const replacements = {
    VITE_SUPABASE_URL: process.env.NEW_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.NEW_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.NEW_SUPABASE_SERVICE_ROLE_KEY,
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
    if (!replacements.VITE_SUPABASE_URL.includes(TARGET_REF)) {
        throw new Error(`Safety check failed: NEW_SUPABASE_URL is not target ${TARGET_REF}.`);
    }

    const current = await readFile(ENV_PATH, 'utf8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const directory = new URL(`cutover-${timestamp}/`, BACKUP_ROOT);
    const backup = new URL('.env.local.before-supabase-cutover', directory);
    await mkdir(directory, { recursive: true });
    await copyFile(ENV_PATH, backup);
    await writeFile(LATEST_POINTER, backup.pathname, { mode: 0o600 });

    const updated = replaceVariables(current, replacements);
    await writeFile(ENV_PATH, updated, { mode: 0o600 });
    console.log(`Supabase cutover applied to target ${TARGET_REF}.`);
    console.log(`Rollback backup saved under .supabase-migration-backups/cutover-${timestamp}/.`);
}

async function rollback() {
    const backupPath = (await readFile(LATEST_POINTER, 'utf8')).trim();
    if (!backupPath) throw new Error('No environment backup pointer found.');
    await copyFile(backupPath, ENV_PATH);
    console.log('Supabase environment rolled back to pre-cutover values.');
}

const mode = process.argv[2];
if (mode === '--apply') await apply();
else if (mode === '--rollback') await rollback();
else throw new Error('Use --apply or --rollback.');
