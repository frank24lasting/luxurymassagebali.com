import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Check existing tables
const { data, error } = await supabase
  .from('services')
  .select('id, name')
  .limit(1);

console.log('Connection test:', data, error);

// Note: Creating tables requires running SQL in Supabase dashboard
// The service_prices table needs to be created via Supabase SQL Editor

console.log(`
============================================
SQL untuk membuat tabel service_prices:

CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  duration_minutes INTEGER,
  price INTEGER NOT NULL,
  label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_prices_service_id ON service_prices(service_id);

-- Enable RLS
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read" ON service_prices
  FOR SELECT USING (true);

-- Allow admin all
CREATE POLICY "Allow admin all" ON service_prices
  FOR ALL USING (true);
============================================
`);
