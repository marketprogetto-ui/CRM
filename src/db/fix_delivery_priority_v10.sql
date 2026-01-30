-- ==========================================
-- FIX V10: ADD PRIORITY COLUMN TO DELIVERY
-- ==========================================

-- The error "Could not find the 'priority' column" confirms it's missing in delivery_opportunities.
-- We must make the schema consistent with the Frontend Form.

ALTER TABLE delivery_opportunities 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- Also ensure other potential missing columns from the form are present
ALTER TABLE delivery_opportunities 
ADD COLUMN IF NOT EXISTS amount_estimated numeric; -- Just in case logic maps it

-- And re-verify the V9 constraints (Safety Check)
ALTER TABLE delivery_opportunities ALTER COLUMN commercial_opportunity_id DROP NOT NULL;
ALTER TABLE delivery_opportunities ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE delivery_opportunities ALTER COLUMN primary_contact_id DROP NOT NULL;
