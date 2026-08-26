-- Fix RLS policies for articles table
-- Jalankan di Supabase SQL Editor

DROP POLICY IF EXISTS "Public read published articles" ON articles;
DROP POLICY IF EXISTS "Admin write articles" ON articles;
DROP POLICY IF EXISTS "Admin update articles" ON articles;
DROP POLICY IF EXISTS "Admin delete articles" ON articles;

-- Recreate policies
CREATE POLICY "Public read published articles" ON articles 
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admin write articles" ON articles 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update articles" ON articles 
  FOR UPDATE USING (true);

CREATE POLICY "Admin delete articles" ON articles 
  FOR DELETE USING (true);

-- Verify
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'articles';
