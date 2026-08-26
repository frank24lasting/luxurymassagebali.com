/**
 * Cloudinary Upload Preset Creator
 * Run: node cloudinary-preset.mjs
 * Credentials loaded from .env.local
 */

import crypto from 'crypto';
import https from 'https';
import { config } from 'dotenv';

config({ path: '.env.local' });

const CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function sign(params) {
  const s = Object.keys(params).sort()
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
  return crypto.createHash('sha256').update(s + API_SECRET).digest('hex');
}

function api(action, params = {}) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.round(Date.now() / 1000);
    const allParams = { api_key: API_KEY, timestamp, ...params };
    const signature = sign(allParams);
    const query = Object.entries({ ...allParams, signature })
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

    const opts = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/${action}?${query}`,
      method: 'GET',
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
    req.end();
  });
}

async function main() {
  console.log('☁️  Cloudinary Upload Preset Creator');
  console.log('   Cloud:', CLOUD_NAME);

  // Check existing presets
  console.log('\n📋 Checking existing presets...');
  const list = await api('upload_presets');
  const existing = list.d?.presets?.find(p => p.name === 'luxury-massage-bali-upload');

  if (existing) {
    console.log('   ⚠️  Preset "luxury-massage-bali-upload" already exists!');
    console.log(`   Folder: ${existing.folder}`);
    console.log('   Update VITE_CLOUDINARY_UPLOAD_PRESET=luxury-massage-bali-upload in .env.local');
    return;
  }

  console.log('   ✅ Preset not found — create it manually at:');
  console.log(`   https://cloudinary.com/app/${CLOUD_NAME}/settings/upload`);
  console.log('\n📋 Settings to use:');
  console.log('   1. Sign On: Unsigned');
  console.log('   2. Folder: luxury-massage-bali');
  console.log('   3. Allowed Formats: jpg, jpeg, png, webp, gif, avif, mp4, webm, mov');
  console.log('   4. Max File Size: 100MB');
  console.log('   5. Auto-create variants: ON');
  console.log('   6. Access Mode: Public');
  console.log('\n   Save preset → copy name to VITE_CLOUDINARY_UPLOAD_PRESET in .env.local');
}

main().catch(console.error);
