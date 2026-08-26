/**
 * Supabase Seed Script — REST API Only
 * Run: node supabase-seed.mjs
 * Requires: tables exist first (run supabase-schema.sql in Dashboard)
 * Credentials loaded from .env.local via dotenv
 */

import https from 'https';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME;

if (!SUPABASE_URL || !ANON_KEY || !CLOUD_NAME) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CLOUDINARY_CLOUD_NAME');
}

const SUPABASE_HOSTNAME = new URL(SUPABASE_URL).hostname;

function post(table, data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: SUPABASE_HOSTNAME,
      path: `/rest/v1/${table}`,
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    };

    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', () => resolve({ status: 0, data: null }));
    req.write(body);
    req.end();
  });
}

function get(table) {
  return new Promise((resolve) => {
    const opts = {
      hostname: SUPABASE_HOSTNAME,
      path: `/rest/v1/${table}`,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=none',
      },
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', () => resolve({ status: 0, data: null }));
    req.end();
  });
}

const BASE_IMG = (w = 800) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_limit,f_auto,q_auto,w_${w}`;

async function seed() {
  console.log('📡 Testing Supabase connection...\n');
  console.log('   URL:', SUPABASE_URL);

  // Check tables exist
  const svcCheck = await get('services?select=id');
  const heroCheck = await get('hero_slides?select=id');
  console.log('   Services table:', svcCheck.status === 200 ? '✅ exists' : '❌ missing');
  console.log('   Hero slides table:', heroCheck.status === 200 ? '✅ exists' : '❌ missing\n');

  if (svcCheck.status !== 200 || heroCheck.status !== 200) {
    console.log('❌ Tables missing. Run supabase-schema.sql in Supabase Dashboard first.');
    return;
  }

  // --- Services ---
  console.log('📦 Seeding services...\n');
  const services = [
    { name: 'Balinese Massage', slug: 'balinese-massage', description: 'Traditional Balinese massage technique using palm and thumb pressure to relieve muscle tension and promote deep relaxation.', duration_minutes: 60, price: 350000, category: 'Massage', image_url: `${BASE_IMG(800)}/spa-jimbaran/services/balinese-massage.jpg`, sort_order: 0 },
    { name: 'Hot Stone Massage', slug: 'hot-stone-massage', description: 'Heated volcanic stones placed on key energy points to melt away stress, relax muscles, and restore body balance naturally.', duration_minutes: 90, price: 450000, category: 'Massage', image_url: `${BASE_IMG(800)}/spa-jimbaran/services/hot-stone-massage.jpg`, sort_order: 1 },
    { name: 'Herbal Facial', slug: 'herbal-facial', description: 'Facial treatment using traditional Bali herbal ingredients to cleanse, nourish, and brighten skin for a healthy glow.', duration_minutes: 75, price: 300000, category: 'Facial', image_url: `${BASE_IMG(800)}/spa-jimbaran/services/herbal-facial.jpg`, sort_order: 2 },
    { name: 'Royal Lulur', slug: 'royal-lulur', description: 'Ancient Javanese royal body scrub using turmeric, rice powder, and aromatic spices to exfoliate and brighten skin.', duration_minutes: 120, price: 500000, category: 'Body Treatment', image_url: `${BASE_IMG(800)}/spa-jimbaran/services/royal-lulur.jpg`, sort_order: 3 },
    { name: 'Aromatherapy Massage', slug: 'aromatherapy-massage', description: 'Relaxing full-body massage with premium essential oils selected for stress relief, energy boost, or deep sleep.', duration_minutes: 60, price: 380000, category: 'Massage', image_url: `${BASE_IMG(800)}/spa-jimbaran/services/aromatherapy.jpg`, sort_order: 4 },
    { name: 'Couple Retreat Package', slug: 'couple-retreat', description: 'Romantic spa package designed for couples — private room, side-by-side massage, flower bath, and champagne.', duration_minutes: 150, price: 1200000, category: 'Couple Package', image_url: `${BASE_IMG(800)}/spa-jimbaran/services/couple-package.jpg`, sort_order: 5 },
  ];

  for (const s of services) {
    const r = await post('services', s);
    if (r.status === 201) console.log('   ✅', s.name);
    else if (r.status === 409) console.log('   ⚠️ ', s.name, '(already exists)');
    else console.log('   ❌', s.name, `(${r.status})`);
  }

  // --- Hero Slides ---
  console.log('\n🎬 Seeding hero slides...\n');
  const slides = [
    { type: 'image', media_url: `${BASE_IMG(1920)}/spa-jimbaran/hero/hero-spa-entrance.jpg`, headline: 'Private Wellness, Delivered Across Bali', subheadline: '✦ Luxury Home Massage ✦', cta_text: 'Book Now', cta_link: '/appointment', sort_order: 0, is_active: true, animation_preset: 'kenburns' },
    { type: 'image', media_url: `${BASE_IMG(1920)}/spa-jimbaran/hero/hero-massage.jpg`, headline: 'Relaxasi Premium di Lokasi Anda', subheadline: '✦ Professional Therapists ✦', cta_text: 'Lihat Layanan', cta_link: '/services', sort_order: 1, is_active: true, animation_preset: 'fade' },
    { type: 'image', media_url: `${BASE_IMG(1920)}/spa-jimbaran/hero/hero-bath.jpg`, headline: 'Couple Massage untuk Momen Istimewa', subheadline: '✦ Private Couple Experience ✦', cta_text: 'Pesan Sekarang', cta_link: '/appointment', sort_order: 2, is_active: true, animation_preset: 'slide' },
  ];

  for (const s of slides) {
    const r = await post('hero_slides', s);
    if (r.status === 201) console.log('   ✅ Slide', s.sort_order + 1);
    else if (r.status === 409) console.log('   ⚠️ Slide', s.sort_order + 1, '(already exists)');
    else console.log('   ❌ Slide', s.sort_order + 1, `(${r.status})`);
  }

  // Verify
  const svcCount = await get('services?select=id');
  const heroCount = await get('hero_slides?select=id');
  console.log('\n🔍 Verifying...\n');
  console.log('   Services in DB:', Array.isArray(svcCount.data) ? svcCount.data.length : 0);
  console.log('   Hero slides in DB:', Array.isArray(heroCount.data) ? heroCount.data.length : 0);
  console.log('\n✅ Done! Supabase is connected and seeded.');
}

seed().catch(console.error);
