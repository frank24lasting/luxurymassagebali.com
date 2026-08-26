import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fubdkrbvtzopftqtrieq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1YmRrcmJ2dHpvcGZ0cXRyaWVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI0MDc0OSwiZXhwIjoyMDk4ODE2NzQ5fQ.-yi1P4yi3HJma3V81raEoE48alr0r5DO-IfDGhDGuBE';

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
