import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Check if service_prices table exists
const { error } = await supabase.from('service_prices').select('id').limit(1);

if (error && error.code === '42P01') {
  console.log('❌ Table service_prices does not exist');
  console.log('');
  console.log('📋 Please run this SQL in Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('```sql');
  console.log(`CREATE TABLE service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  duration_minutes INTEGER,
  price INTEGER NOT NULL,
  label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_prices_service_id ON service_prices(service_id);
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON service_prices FOR SELECT USING (true);
CREATE POLICY "Allow admin all" ON service_prices FOR ALL USING (true);

-- Migrate existing prices
INSERT INTO service_prices (service_id, duration_minutes, price, label, sort_order)
SELECT id, duration_minutes, price, 
  CASE WHEN duration_minutes IS NOT NULL THEN duration_minutes || ' Minutes' ELSE 'Standard' END, 0
FROM services
WHERE NOT EXISTS (SELECT 1 FROM service_prices sp WHERE sp.service_id = services.id);

ALTER TABLE services ALTER COLUMN price DROP NOT NULL;
ALTER TABLE services ALTER COLUMN duration_minutes DROP NOT NULL;`);
  console.log('```');
  process.exit(1);
} else if (error) {
  console.log('❌ Error:', error);
  process.exit(1);
} else {
  console.log('✅ Table service_prices exists');

  // Show current prices
  const { data: prices } = await supabase
    .from('service_prices')
    .select('*, services(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Sample prices:', JSON.stringify(prices, null, 2));
}
