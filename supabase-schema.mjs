/**
 * Supabase Schema Setup Script
 * Creates all tables, RLS, indexes, and seed data via REST API
 * Run: node supabase-schema.mjs
 * Credentials loaded from .env.local
 */

import https from 'https';
import fs from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !CLOUD_NAME) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CLOUDINARY_CLOUD_NAME');
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const restPath = path.startsWith('/rest/v1') ? path : `/rest/v1${path}`;
    const url = new URL(restPath, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkTable(table) {
  const res = await request('GET', `/${table}?limit=1`);
  return res.status === 200 || res.status === 201;
}

const BASE_IMG = (w = 800) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_limit,f_auto,q_auto,w_${w}`;

async function main() {
  console.log('========================================');
  console.log('🏗️  SUPABASE SCHEMA SETUP');
  console.log('========================================');
  console.log(`   Project: ${SUPABASE_URL}\n`);

  // Verify connection
  console.log('📡 Verifying connection...');
  const health = await request('GET', '/');
  if (health.status === 200) {
    console.log('   ✅ Connected!\n');
  } else {
    console.log(`   ❌ Failed (${health.status}). Check .env.local\n`);
    process.exit(1);
  }

  // Check existing tables
  console.log('📋 Checking tables...');
  const tables = ['services', 'hero_slides', 'articles', 'appointments', 'media', 'site_settings'];
  for (const t of tables) {
    const ok = await checkTable(t);
    console.log(`   ${ok ? '✅' : '⚠️ '}: ${t}`);
  }

  // Generate schema SQL
  const schemaSQL = `
// ============================================
// LUXURY MASSAGE BALI - Supabase Database Schema
// Run this in Supabase SQL Editor
// ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 60,
  price DECIMAL(10,2) DEFAULT 0,
  category TEXT DEFAULT 'Massage',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id UUID REFERENCES services(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  therapist_preference TEXT DEFAULT 'no_preference',
  special_request TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content JSONB,
  cover_image TEXT,
  author TEXT DEFAULT 'Admin',
  category TEXT DEFAULT 'General',
  tags TEXT[],
  status TEXT DEFAULT 'draft',
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  schema_markup JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  cdn_url TEXT,
  mime_type TEXT,
  size_bytes INT,
  alt_text TEXT,
  metadata JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'image',
  media_url TEXT NOT NULL,
  headline TEXT,
  subheadline TEXT,
  cta_text TEXT DEFAULT 'Book Now',
  cta_link TEXT DEFAULT '/appointment',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  animation_preset TEXT DEFAULT 'kenburns'
);

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read + write for all anon operations
CREATE POLICY IF NOT EXISTS "pub_read" ON services FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "pub_ins" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "pub_read_app" ON appointments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "pub_ins_app" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "pub_read_art" ON articles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "pub_read_media" ON media FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "pub_ins_media" ON media FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "pub_read_hero" ON hero_slides FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "pub_ins_hero" ON hero_slides FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "pub_read_set" ON site_settings FOR SELECT USING (true);

-- Seed
INSERT INTO services (name, slug, description, duration_minutes, price, category, image_url, sort_order) VALUES
('Balinese Massage', 'balinese-massage', 'Traditional Balinese massage technique using palm and thumb pressure to relieve muscle tension and promote deep relaxation.', 60, 350000, 'Massage', '${BASE_IMG(800)}/spa-jimbaran/services/balinese-massage.jpg', 0),
('Hot Stone Massage', 'hot-stone-massage', 'Heated volcanic stones placed on key energy points to melt away stress, relax muscles, and restore body balance naturally.', 90, 450000, 'Massage', '${BASE_IMG(800)}/spa-jimbaran/services/hot-stone-massage.jpg', 1),
('Herbal Facial', 'herbal-facial', 'Facial treatment using traditional Bali herbal ingredients to cleanse, nourish, and brighten skin for a healthy glow.', 75, 300000, 'Facial', '${BASE_IMG(800)}/spa-jimbaran/services/herbal-facial.jpg', 2),
('Royal Lulur', 'royal-lulur', 'Ancient Javanese royal body scrub using turmeric, rice powder, and aromatic spices to exfoliate and brighten skin.', 120, 500000, 'Body Treatment', '${BASE_IMG(800)}/spa-jimbaran/services/royal-lulur.jpg', 3),
('Aromatherapy Massage', 'aromatherapy-massage', 'Relaxing full-body massage with premium essential oils selected for stress relief, energy boost, or deep sleep.', 60, 380000, 'Massage', '${BASE_IMG(800)}/spa-jimbaran/services/aromatherapy.jpg', 4),
('Couple Retreat Package', 'couple-retreat', 'Romantic spa package designed for couples — private room, side-by-side massage, flower bath, and champagne.', 150, 1200000, 'Couple Package', '${BASE_IMG(800)}/spa-jimbaran/services/couple-package.jpg', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO hero_slides (type, media_url, headline, subheadline, cta_text, cta_link, sort_order, is_active, animation_preset) VALUES
('image', '${BASE_IMG(1920)}/spa-jimbaran/hero/hero-spa-entrance.jpg', 'Private Wellness, Delivered Across Bali', '✦ Luxury Home Massage ✦', 'Book Now', '/appointment', 0, true, 'kenburns'),
('image', '${BASE_IMG(1920)}/spa-jimbaran/hero/hero-massage.jpg', 'Relaxasi Premium di Lokasi Anda', '✦ Professional Therapists ✦', 'Lihat Layanan', '/services', 1, true, 'fade'),
('image', '${BASE_IMG(1920)}/spa-jimbaran/hero/hero-bath.jpg', 'Couple Massage untuk Momen Istimewa', '✦ Private Couple Experience ✦', 'Pesan Sekarang', '/appointment', 2, true, 'slide')
ON CONFLICT DO NOTHING;
`;

  fs.writeFileSync('supabase-schema.sql', schemaSQL);
  console.log('\n   ✅ Schema saved to supabase-schema.sql');

  // Test insert
  console.log('\n🧪 Testing seed insert...');
  const seed = [
    { name: 'Balinese Massage', slug: 'balinese-massage', description: 'Test', duration_minutes: 60, price: 350000, category: 'Massage', image_url: `${BASE_IMG(800)}/test.jpg`, sort_order: 0 },
  ];
  const r = await request('POST', '/services', seed[0]);
  console.log(`   ${r.status === 201 ? '✅' : r.status === 409 ? '⚠️ already exists' : '❌ ' + r.status}`);

  console.log('\n========================================');
  console.log('✅ SETUP CHECK COMPLETE!');
  console.log('========================================\n');
  console.log('📝 Next: Run supabase-schema.sql in Supabase Dashboard SQL Editor');
  console.log('');
}

main().catch(console.error);
