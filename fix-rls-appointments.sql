-- Fix RLS policies for appointments delete access
-- Jalankan di Supabase SQL Editor jika delete appointment masih gagal karena RLS.

DROP POLICY IF EXISTS "Admin delete appointments" ON appointments;
CREATE POLICY "Admin delete appointments" ON appointments
  FOR DELETE USING (true);

-- Verify
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;
