-- DATA WIPE (RESET TRANSACTIONAL DATA)
-- This script wipes all business data (Opportunities, Deliveries, Activities, Logs)
-- It preserves: Users (Sort of, assuming profiles match auth), Pipelines config, Stages config, Products.

-- Disable triggers if necessary, but TRUNCATE is usually fast.
BEGIN;

-- 1. Truncate tables with CASCADE to handle foreign keys
TRUNCATE TABLE 
    activities,
    proposal_items, 
    proposals, 
    payment_instructions,
    opportunity_stage_history,
    delivery_opportunities, 
    opportunities
RESTART IDENTITY CASCADE;

-- 2. Optional: Clear storage objects if needed
-- DELETE FROM storage.objects WHERE bucket_id IN ('proposals', 'briefings', 'photos');

COMMIT;

SELECT 'Base de dados zerada com sucesso (Opportunities, Deliveries, Activities, Histories)' as result;
