import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const MODE = process.argv[2];
if (!['--dry-run', '--apply'].includes(MODE)) throw new Error('Use --dry-run or --apply.');

const TABLES = ['site_settings', 'services', 'service_prices', 'pages', 'appointments', 'articles', 'media', 'hero_slides'];
const TARGET_FOLDER = 'luxury-massage-bali';
const VIDEO_EXT = new Set(['mp4', 'mov', 'webm', 'avi', 'mkv']);
const BACKUP_ROOT = new URL('./.supabase-migration-backups/', import.meta.url);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const oldCloud = process.env.OLD_CLOUDINARY_CLOUD_NAME;
const newCloud = process.env.NEW_CLOUDINARY_CLOUD_NAME;
const newApiKey = process.env.NEW_CLOUDINARY_API_KEY;
const newApiSecret = process.env.NEW_CLOUDINARY_API_SECRET;

for (const [name, value] of Object.entries({
  VITE_SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
  OLD_CLOUDINARY_CLOUD_NAME: oldCloud,
  NEW_CLOUDINARY_CLOUD_NAME: newCloud,
  NEW_CLOUDINARY_API_KEY: newApiKey,
  NEW_CLOUDINARY_API_SECRET: newApiSecret,
})) {
  if (!value) throw new Error(`Missing ${name}.`);
}
if (oldCloud === newCloud) throw new Error('Safety check failed: old and new Cloudinary cloud names are identical.');

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
const assetPattern = new RegExp(
  `https?://res\\.cloudinary\\.com/${oldCloud}/(image|video|raw)/upload/((?:[a-z]{1,3}_[^/\\s"'\\\\]*/)*)(?:v\\d+/)?([^\\s"'\\\\?)]+)`,
  'g',
);

const MEDIA_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'jfif', 'svg', 'mp4', 'mov', 'webm', 'avi', 'mkv']);

function stripRepeatedExtensions(base) {
  let name = base;
  for (;;) {
    const dot = name.lastIndexOf('.');
    if (dot <= 0) return name;
    const candidate = name.slice(dot + 1).toLowerCase();
    if (!MEDIA_EXT.has(candidate)) return name;
    name = name.slice(0, dot);
  }
}

function targetPublicId(sourcePublicId) {
  const fileName = sourcePublicId.slice(sourcePublicId.lastIndexOf('/') + 1);
  const dot = fileName.lastIndexOf('.');
  const rawBase = dot > 0 ? fileName.slice(0, dot) : fileName;
  const cleaned = stripRepeatedExtensions(rawBase)
    .toLowerCase()
    .replace(/spa[-_]?jimbaran/g, 'luxury-massage-bali')
    .replace(/(luxury-massage-bali)(?:-?bali)+/g, '$1')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  return `${TARGET_FOLDER}/${cleaned || 'asset'}`;
}

function resourceTypeFor(publicId) {
  const ext = publicId.slice(publicId.lastIndexOf('.') + 1).toLowerCase();
  return VIDEO_EXT.has(ext) ? 'video' : 'image';
}

function stripExtension(publicId) {
  const dot = publicId.lastIndexOf('.');
  const slash = publicId.lastIndexOf('/');
  return dot > slash ? publicId.slice(0, dot) : publicId;
}

async function loadRows() {
  const rows = [];
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw new Error(`Read ${table} failed: ${error.message}`);
    rows.push({ table, data });
  }
  return rows;
}

function collectAssets(rows) {
  const assets = new Map();
  for (const { table, data } of rows) {
    for (const row of data) {
      for (const match of JSON.stringify(row).matchAll(assetPattern)) {
        const publicId = match[3];
        if (!assets.has(publicId)) assets.set(publicId, { resourceType: match[1], tables: new Set() });
        assets.get(publicId).tables.add(table);
      }
    }
  }
  return assets;
}

function signParams(params) {
  const toSign = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  return createHash('sha1').update(`${toSign}${newApiSecret}`).digest('hex');
}

async function uploadFromRemote(sourceUrl, publicId, resourceType) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { overwrite: 'true', public_id: stripExtension(publicId), timestamp: String(timestamp) };
  const body = new URLSearchParams({
    ...signed,
    file: sourceUrl,
    api_key: newApiKey,
    signature: signParams(signed),
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${newCloud}/${resourceType}/upload`, {
    method: 'POST',
    body,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `HTTP ${response.status}`);
  return payload.secure_url;
}

function rewriteString(value, mapping) {
  return value.replace(assetPattern, (fullMatch, _type, transformation, publicId) => {
    const replacement = mapping.get(publicId);
    if (!replacement) return fullMatch;
    return transformation ? replacement.replace('/upload/', `/upload/${transformation}`) : replacement;
  });
}

function rewriteValue(value, mapping) {
  if (typeof value === 'string') return rewriteString(value, mapping);
  if (Array.isArray(value)) return value.map((item) => rewriteValue(item, mapping));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteValue(item, mapping)]));
  }
  return value;
}

const rows = await loadRows();
const assets = collectAssets(rows);

console.log('=== CLOUDINARY MIGRATION ===');
console.log(`Mode        : ${MODE}`);
console.log(`Source cloud: ${oldCloud}`);
console.log(`Target cloud: ${newCloud}`);
console.log(`Target folder: ${TARGET_FOLDER}/`);
console.log(`Unique assets: ${assets.size}\n`);

if (assets.size === 0) {
  console.log('Nothing to migrate.');
  process.exit(0);
}

if (MODE === '--dry-run') {
  for (const [publicId, info] of assets) {
    console.log(`  ${info.resourceType.padEnd(5)} ${publicId}`);
    console.log(`        -> ${targetPublicId(publicId)}  (tables: ${[...info.tables].join(', ')})`);
  }
  console.log('\nNo asset uploaded and no database row changed.');
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const directory = new URL(`cloudinary-${timestamp}/`, BACKUP_ROOT);
await mkdir(directory, { recursive: true });
await writeFile(new URL('database-before.json', directory), JSON.stringify(rows, null, 2), { mode: 0o600 });
console.log(`Database backup saved: .supabase-migration-backups/cloudinary-${timestamp}/database-before.json\n`);

const mapping = new Map();
const failures = [];
for (const [publicId, info] of assets) {
  const sourceUrl = `https://res.cloudinary.com/${oldCloud}/${info.resourceType}/upload/${publicId}`;
  const resourceType = info.resourceType === 'image' ? resourceTypeFor(publicId) : info.resourceType;
  try {
    const secureUrl = await uploadFromRemote(sourceUrl, targetPublicId(publicId), resourceType);
    mapping.set(publicId, secureUrl);
    console.log(`  copied  ${publicId}`);
  } catch (error) {
    failures.push({ publicId, message: error.message });
    console.error(`  FAILED  ${publicId} -> ${error.message}`);
  }
}

await writeFile(new URL('asset-mapping.json', directory), JSON.stringify([...mapping], null, 2), { mode: 0o600 });

if (failures.length > 0) {
  console.error(`\n${failures.length} asset(s) failed. Database URLs were NOT changed. Fix and re-run.`);
  process.exit(1);
}

let updatedRows = 0;
for (const { table, data } of rows) {
  for (const row of data) {
    const rewritten = rewriteValue(row, mapping);
    const changed = Object.fromEntries(
      Object.entries(rewritten).filter(([key]) => JSON.stringify(row[key]) !== JSON.stringify(rewritten[key])),
    );
    if (Object.keys(changed).length === 0) continue;
    const { error } = await supabase.from(table).update(changed).eq('id', row.id);
    if (error) throw new Error(`Update ${table} ${row.id} failed: ${error.message}`);
    updatedRows += 1;
  }
}

console.log(`\nAssets copied : ${mapping.size}`);
console.log(`Rows rewritten: ${updatedRows}`);
console.log('Source Cloudinary account was not modified.');
