-- ==========================================
-- FIX RELATIONSHIPS (FKs)
-- ==========================================

-- 1. Fix 'owner_id' to point to 'profiles' (Required for Supabase Fetching)
-- First, typically in Supabase 'profiles' table replicates 'auth.users'.
-- If your previous 'opportunities' worked, 'profiles' must exist.
-- We ensure 'delivery_opportunities' links 'owner_id' TO 'profiles.id' so the query "profiles(full_name)" works.

ALTER TABLE delivery_opportunities
DROP CONSTRAINT IF EXISTS delivery_opportunities_owner_id_fkey;

-- We try to reference profiles. If profiles doesn't exist, this might fail, 
-- but assuming standard Supabase setup where profiles is present.
DO $$
BEGIN
    -- Check if profiles table exists to be safe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE delivery_opportunities
        ADD CONSTRAINT delivery_opportunities_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES profiles(id)
        ON DELETE SET NULL;
    ELSE
        -- Fallback: Reference auth.users if profiles is missing (though Fetch will fail on join)
        ALTER TABLE delivery_opportunities
        ADD CONSTRAINT delivery_opportunities_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Fix Pipeline & Stage Relations (Good Practice)
ALTER TABLE delivery_opportunities
DROP CONSTRAINT IF EXISTS delivery_opportunities_pipeline_id_fkey;

ALTER TABLE delivery_opportunities
ADD CONSTRAINT delivery_opportunities_pipeline_id_fkey
FOREIGN KEY (pipeline_id)
REFERENCES pipelines(id)
ON DELETE CASCADE;

ALTER TABLE delivery_opportunities
DROP CONSTRAINT IF EXISTS delivery_opportunities_stage_id_fkey;

ALTER TABLE delivery_opportunities
ADD CONSTRAINT delivery_opportunities_stage_id_fkey
FOREIGN KEY (stage_id)
REFERENCES stages(id)
ON DELETE SET NULL;

-- 3. Re-run Backfill (Just in case the previous one failed due to RLS or other things)
DO $$
DECLARE
    opp RECORD;
    delivery_pipeline_id uuid;
    start_stage_id uuid;
    exists_check uuid;
BEGIN
    SELECT id INTO delivery_pipeline_id FROM pipelines WHERE slug = 'delivery';
    SELECT id INTO start_stage_id FROM stages WHERE pipeline_id = delivery_pipeline_id AND slug = 'scheduling' LIMIT 1;

    FOR opp IN 
        SELECT o.* 
        FROM opportunities o
        JOIN stages s ON o.stage_id = s.id
        WHERE s.slug = 'closed_won'
    LOOP
        SELECT id INTO exists_check FROM delivery_opportunities WHERE commercial_opportunity_id = opp.id LIMIT 1;
        
        IF exists_check IS NULL AND delivery_pipeline_id IS NOT NULL AND start_stage_id IS NOT NULL THEN
            INSERT INTO delivery_opportunities (
                commercial_opportunity_id, title, owner_id, account_id, primary_contact_id,
                amount_final, stage_id, pipeline_id, billing_status, status, created_at, updated_at
            ) VALUES (
                opp.id, opp.title, opp.owner_id, opp.account_id, opp.contact_id,
                COALESCE(opp.amount_final, opp.amount_offered, opp.amount_estimated, 0),
                start_stage_id, delivery_pipeline_id, 'pending', 'active', NOW(), NOW()
            );
        END IF;
    END LOOP;
END $$;
