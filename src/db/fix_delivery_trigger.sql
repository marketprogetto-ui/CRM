-- ==========================================
-- FIX DELIVERY TRIGGER & PERMISSIONS
-- ==========================================

-- 1. Ensure RLS Policies exist and allow access
ALTER TABLE delivery_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated Read" ON delivery_opportunities;
CREATE POLICY "Authenticated Read" ON delivery_opportunities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert" ON delivery_opportunities;
CREATE POLICY "Authenticated Insert" ON delivery_opportunities FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update" ON delivery_opportunities;
CREATE POLICY "Authenticated Update" ON delivery_opportunities FOR UPDATE TO authenticated USING (true);

-- 2. Update Trigger Function to be robust against column names
CREATE OR REPLACE FUNCTION public.handle_commercial_won()
RETURNS TRIGGER AS $$
DECLARE
    delivery_pipeline_id uuid;
    start_stage_id uuid;
    exists_check uuid;
    contact_val uuid;
BEGIN
    -- Resolve Contact ID (handle both potential column names if they exist, simpler here: assume contact_id)
    -- If you use primary_contact_id in opportunities, create a fallback or specific logic.
    -- For now, we trust contact_id is the main one used by the Modal.
    contact_val := NEW.contact_id;

    -- Check if the new stage is 'closed_won' (ensure case insensitivity if needed)
    IF NEW.stage_id IN (SELECT id FROM stages WHERE slug = 'closed_won') THEN
        
        -- Update status
        NEW.status := 'won';
        NEW.closed_at := NOW();

        -- Check duplicate
        SELECT id INTO exists_check FROM delivery_opportunities WHERE commercial_opportunity_id = NEW.id LIMIT 1;
        
        IF exists_check IS NULL THEN
            -- Get Pipeline & Stage
            SELECT id INTO delivery_pipeline_id FROM pipelines WHERE slug = 'delivery';
            SELECT id INTO start_stage_id FROM stages WHERE pipeline_id = delivery_pipeline_id AND slug = 'scheduling' LIMIT 1;

            IF delivery_pipeline_id IS NOT NULL AND start_stage_id IS NOT NULL THEN
                INSERT INTO delivery_opportunities (
                    commercial_opportunity_id, 
                    title, 
                    owner_id, 
                    account_id, 
                    primary_contact_id,
                    amount_final, 
                    stage_id, 
                    pipeline_id, 
                    billing_status, 
                    status,
                    created_at, 
                    updated_at
                ) VALUES (
                    NEW.id, 
                    NEW.title, 
                    NEW.owner_id, 
                    NEW.account_id, 
                    contact_val,
                    COALESCE(NEW.amount_final, NEW.amount_offered, NEW.amount_estimated, 0),
                    start_stage_id, 
                    delivery_pipeline_id, 
                    'pending', 
                    'active',
                    NOW(), 
                    NOW()
                );
            END IF;
        END IF;
    END IF;

    IF NEW.stage_id IN (SELECT id FROM stages WHERE slug = 'closed_lost') THEN
        NEW.status := 'lost';
        NEW.closed_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-apply Trigger
DROP TRIGGER IF EXISTS on_commercial_won ON opportunities;
CREATE TRIGGER on_commercial_won
BEFORE UPDATE OF stage_id ON opportunities
FOR EACH ROW
EXECUTE FUNCTION public.handle_commercial_won();

-- 4. Manual Fix for Existing "Won" Opportunities (Backfill)
-- If the trigger failed previously, this block attempts to fix missed records.
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
