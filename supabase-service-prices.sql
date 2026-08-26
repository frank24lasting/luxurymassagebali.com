-- Migration: Add service_prices table for multiple pricing options per service
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  duration_minutes INTEGER,           -- null for flexible duration
  price INTEGER NOT NULL,             -- price in IDR
  label TEXT,                         -- e.g., "60 Minutes", "90 Minutes", "Standard", "Premium"
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_prices_service_id ON service_prices(service_id);

-- Enable RLS
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read service_prices" ON service_prices
  FOR SELECT USING (true);

-- Allow admin all access
CREATE POLICY "Allow admin all service_prices" ON service_prices
  FOR ALL USING (true);

-- Migrate existing data: copy current duration_minutes and price from services
-- This will create a default price entry for each existing service
INSERT INTO service_prices (service_id, duration_minutes, price, label, sort_order)
SELECT 
  id,
  duration_minutes,
  price,
  CASE 
    WHEN duration_minutes IS NOT NULL THEN duration_minutes || ' Minutes'
    ELSE 'Standard'
  END,
  0
FROM services
WHERE NOT EXISTS (
  SELECT 1 FROM service_prices sp WHERE sp.service_id = services.id
);

-- Optional: Make price and duration_minutes in services table nullable
-- since prices will now come from service_prices
ALTER TABLE services ALTER COLUMN price DROP NOT NULL;
ALTER TABLE services ALTER COLUMN duration_minutes DROP NOT NULL;
