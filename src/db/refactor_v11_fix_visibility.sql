-- ==========================================
-- FIX V11: FORCE VISIBILITY & SCHEMA RELOAD
-- ==========================================

-- 1. Ensure columns exist (Redundant check)
ALTER TABLE delivery_opportunities ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';
ALTER TABLE delivery_opportunities ADD COLUMN IF NOT EXISTS amount_estimated numeric DEFAULT 0;
ALTER TABLE delivery_opportunities ADD COLUMN IF NOT EXISTS amount_final numeric DEFAULT 0;

-- 2. Ensure RLS is permissive
ALTER TABLE delivery_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON delivery_opportunities;
CREATE POLICY "Enable read access for all users" ON delivery_opportunities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON delivery_opportunities;
CREATE POLICY "Enable insert access for all users" ON delivery_opportunities FOR INSERT TO authenticated WITH CHECK (true);

-- 3. FIX OWNER RELATIONSHIP (Prevent silent failures on join)
-- If owner_id points to a non-existent profile, the join fails if strict.
-- We ensure owner_id is nullable.
ALTER TABLE delivery_opportunities ALTER COLUMN owner_id DROP NOT NULL;

-- 4. RELOAD SCHEMA CACHE (Critical for new columns to appear in API)
NOTIFY pgrst, 'reload config';
