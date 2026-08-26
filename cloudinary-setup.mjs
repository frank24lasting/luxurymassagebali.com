/**
 * Cloudinary Setup — Creates upload folder and upload preset
 * Run: node cloudinary-setup.mjs
 * Credentials loaded from .env.local
 */

import crypto from 'crypto';
import https from 'https';
import { config } from 'dotenv';

config({ path: '.env.local' });

const CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function cloudinaryApi(action, body = null) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/${action}`,
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(b),
      },
    };

    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, d: JSON.parse(d) }); }
        catch { resolve({ s: res.statusCode, d }); }
      });
    });
    req.on('error', reject);
    if (b) req.write(b);
    req.end();
  });
}

async function main() {
  console.log('☁️  Cloudinary Setup');
  console.log('   Cloud:', CLOUD_NAME);

  // Create folder
  console.log('\n📁 Creating folders...');
  const folderRes = await cloudinaryApi('folders/luxury-massage-bali', { path: 'luxury-massage-bali' });
  console.log(`   luxury-massage-bali: ${folderRes.s === 200 || folderRes.s === 400 ? '✅' : folderRes.s}`);

  const folders = ['services', 'hero', 'articles', 'media'];
  for (const f of folders) {
    const r = await cloudinaryApi(`folders/luxury-massage-bali/${f}`, { path: `luxury-massage-bali/${f}` });
    console.log(`   luxury-massage-bali/${f}: ${r.s === 200 || r.s === 400 ? '✅' : r.s}`);
  }

  console.log('\n☁️  Folder creation complete!');
  console.log('   Next: Run cloudinary-preset.mjs to create upload preset');
}

main().catch(console.error);
