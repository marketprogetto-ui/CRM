-- ==========================================
-- REFACTOR V13 (FIXED): CLEANUP & REMOVE DELIVERY
-- ==========================================

-- 1. DROP DELIVERY & PAYMENT TABLES
DROP TABLE IF EXISTS payment_instructions CASCADE;
DROP TABLE IF EXISTS delivery_opportunities CASCADE;
DROP TABLE IF EXISTS delivery_stage_history CASCADE;

-- 2. REMOVE DELIVERY PIPELINE & STAGES
-- Get Delivery ID
DO $$
DECLARE
    del_id uuid;
BEGIN
    SELECT id INTO del_id FROM pipelines WHERE slug = 'delivery';
    
    IF del_id IS NOT NULL THEN
        -- SAFEGUARD: Delete any 'opportunities' improperly linked to Delivery Pipeline
        -- (This fixes the FK constraint error preventing stage deletion)
        DELETE FROM opportunities WHERE pipeline_id = del_id;
        DELETE FROM opportunities WHERE stage_id IN (SELECT id FROM stages WHERE pipeline_id = del_id);

        -- NOW safe to delete stages
        DELETE FROM stages WHERE pipeline_id = del_id;
        
        -- Finally delete the pipeline itself
        DELETE FROM pipelines WHERE id = del_id;
    END IF;
END $$;

-- 3. REMOVE REPLICATION TRIGGERS
DROP TRIGGER IF EXISTS on_commercial_completion ON opportunities;
DROP FUNCTION IF EXISTS public.handle_commercial_completion;

-- 4. CLEANUP OLD FUNCTIONS/TRIGGERS JUST IN CASE
DROP TRIGGER IF EXISTS on_commercial_won ON opportunities;
DROP FUNCTION IF EXISTS public.handle_commercial_won;

-- 5. RELOAD CONFIG
NOTIFY pgrst, 'reload config';
