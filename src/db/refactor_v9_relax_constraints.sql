-- ==========================================
-- FIX V9: RELAX DELIVERY CONSTRAINTS
-- ==========================================

-- Allow standalone Delivery Opportunities (not linked to Commercial)
ALTER TABLE delivery_opportunities 
ALTER COLUMN commercial_opportunity_id DROP NOT NULL;

-- Allow Delivery Opportunities without Account/Contact (e.g. internal tasks or quick creates)
ALTER TABLE delivery_opportunities 
ALTER COLUMN account_id DROP NOT NULL;

ALTER TABLE delivery_opportunities 
ALTER COLUMN primary_contact_id DROP NOT NULL;

-- Also ensure 'owner_id' is nullable just in case of system automation
ALTER TABLE delivery_opportunities 
ALTER COLUMN owner_id DROP NOT NULL;

-- Ensure billing_status has default 'pending'
ALTER TABLE delivery_opportunities 
ALTER COLUMN billing_status SET DEFAULT 'pending';

-- Ensure status has default 'active'
ALTER TABLE delivery_opportunities 
ALTER COLUMN status SET DEFAULT 'active';

-- Re-verify RLS just to be 100% sure
ALTER TABLE delivery_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON delivery_opportunities;
CREATE POLICY "Enable read access for all users" ON delivery_opportunities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON delivery_opportunities;
CREATE POLICY "Enable insert access for all users" ON delivery_opportunities FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON delivery_opportunities;
CREATE POLICY "Enable update access for all users" ON delivery_opportunities FOR UPDATE TO authenticated USING (true);
