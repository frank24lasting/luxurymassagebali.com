/**
 * Supabase RLS & Schema Checker
 * Run: node supabase-fix.mjs
 * Credentials loaded from .env.local
 */

import https from 'https';
import { config } from 'dotenv';

config({ path: '.env.local' });

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

const SUPABASE_HOSTNAME = new URL(URL).hostname;

function api(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const b = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: SUPABASE_HOSTNAME,
      path: '/rest/v1/' + path,
      method: method,
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
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
    req.on('error', e => resolve({ s: 0, d: e.message }));
    if (b) req.write(b);
    req.end();
  });
}

async function main() {
  console.log('🔍 Checking Supabase tables and RLS...\n');
  console.log('   Project:', URL);

  // Check tables
  const tables = ['services', 'hero_slides', 'appointments', 'articles', 'media', 'site_settings'];
  for (const t of tables) {
    const r = await api(`${t}?limit=1&select=id`);
    console.log(`   ${t}: ${r.s === 200 ? '✅' : r.s === 404 ? '❌ missing' : '⚠️ ' + r.s}`);
  }

  // Check RLS on hero_slides
  console.log('\n💡 If hero_slides INSERT fails, run this in SQL Editor:');
  console.log('   ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;');
  console.log('   CREATE POLICY "hero_pub" ON hero_slides FOR SELECT USING (true);');
  console.log('   CREATE POLICY "hero_ins" ON hero_slides FOR INSERT WITH CHECK (true);');
}

main().catch(console.error);
