import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');

const TABLES = ['site_settings', 'services', 'service_prices', 'pages', 'appointments', 'articles', 'media', 'hero_slides'];
const CLOUDINARY_URL = /https?:\/\/res\.cloudinary\.com\/([^/\s"'\\]+)\/(?:image|video|raw)\/upload\/(?:[^/\s"'\\]*\/)*?(?:v\d+\/)?([^\s"'\\?)]+)/g;

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const envPresence = {
  VITE_CLOUDINARY_CLOUD_NAME: Boolean(process.env.VITE_CLOUDINARY_CLOUD_NAME),
  VITE_CLOUDINARY_UPLOAD_PRESET: Boolean(process.env.VITE_CLOUDINARY_UPLOAD_PRESET),
  CLOUDINARY_API_KEY: Boolean(process.env.CLOUDINARY_API_KEY),
  CLOUDINARY_API_SECRET: Boolean(process.env.CLOUDINARY_API_SECRET),
  OLD_CLOUDINARY_CLOUD_NAME: Boolean(process.env.OLD_CLOUDINARY_CLOUD_NAME),
  OLD_CLOUDINARY_API_KEY: Boolean(process.env.OLD_CLOUDINARY_API_KEY),
  OLD_CLOUDINARY_API_SECRET: Boolean(process.env.OLD_CLOUDINARY_API_SECRET),
  NEW_CLOUDINARY_CLOUD_NAME: Boolean(process.env.NEW_CLOUDINARY_CLOUD_NAME),
  NEW_CLOUDINARY_API_KEY: Boolean(process.env.NEW_CLOUDINARY_API_KEY),
  NEW_CLOUDINARY_API_SECRET: Boolean(process.env.NEW_CLOUDINARY_API_SECRET),
};

const byCloud = new Map();
const perTable = [];
let scannedRows = 0;

for (const table of TABLES) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    perTable.push({ table, status: `ERROR: ${error.message}`, rows: 0, refs: 0 });
    continue;
  }
  scannedRows += data.length;
  let refs = 0;
  for (const row of data) {
    const serialized = JSON.stringify(row);
    for (const match of serialized.matchAll(CLOUDINARY_URL)) {
      refs += 1;
      const [, cloudName, publicId] = match;
      if (!byCloud.has(cloudName)) byCloud.set(cloudName, new Map());
      const assets = byCloud.get(cloudName);
      const existing = assets.get(publicId) || { count: 0, tables: new Set() };
      existing.count += 1;
      existing.tables.add(table);
      assets.set(publicId, existing);
    }
  }
  perTable.push({ table, status: 'OK', rows: data.length, refs });
}

console.log('=== CLOUDINARY AUDIT (READ-ONLY) ===\n');

console.log('Environment variables present:');
for (const [name, present] of Object.entries(envPresence)) {
  console.log(`  ${present ? 'YES' : 'no '}  ${name}`);
}

console.log(`\nActive cloud name in app: ${process.env.VITE_CLOUDINARY_CLOUD_NAME || '(unset)'}`);

console.log('\nPer-table scan:');
for (const row of perTable) {
  console.log(`  ${row.table.padEnd(16)} rows=${String(row.rows).padStart(3)}  cloudinaryRefs=${String(row.refs).padStart(3)}  ${row.status}`);
}
console.log(`  TOTAL rows scanned: ${scannedRows}`);

console.log('\nAssets grouped by cloud name:');
if (byCloud.size === 0) console.log('  (none found)');
for (const [cloudName, assets] of byCloud) {
  const totalRefs = [...assets.values()].reduce((sum, a) => sum + a.count, 0);
  console.log(`\n  cloud "${cloudName}": ${assets.size} unique assets, ${totalRefs} references`);
  const folders = new Map();
  for (const publicId of assets.keys()) {
    const folder = publicId.includes('/') ? publicId.slice(0, publicId.lastIndexOf('/')) : '(root)';
    folders.set(folder, (folders.get(folder) || 0) + 1);
  }
  for (const [folder, count] of [...folders].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(count).padStart(3)} in ${folder}`);
  }
}

console.log('\nUnique asset list:');
for (const [cloudName, assets] of byCloud) {
  for (const [publicId, info] of assets) {
    console.log(`  ${cloudName} :: ${publicId}  (used in ${[...info.tables].join(', ')})`);
  }
}

console.log('\nNo data was modified.');
