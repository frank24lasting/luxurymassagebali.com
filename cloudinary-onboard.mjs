/**
 * Cloudinary Onboarding Verification
 * Run: node cloudinary-onboard.mjs
 * Credentials loaded from .env.local
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

const CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;

async function main() {
  console.log('☁️  Cloudinary Onboarding Check');
  console.log('   Cloud Name:', CLOUD_NAME);
  console.log('   API Key:', API_KEY ? '✅ set' : '❌ missing');
  console.log('   Upload Preset:', process.env.VITE_CLOUDINARY_UPLOAD_PRESET || '❌ missing');

  console.log('\n📋 Checklist:');
  console.log('   1. ☁️  Cloudinary account: https://cloudinary.com');
  console.log('   2. 📁 Folders created: luxury-massage-bali/{services,hero,articles,media}');
  console.log('   3. 🔧 Upload preset: luxury-massage-bali-upload (unsigned)');
  console.log('   4. 📝 Update .env.local with all credentials');
  console.log('   5. 🚀 Run: npm run dev');
}

main();
