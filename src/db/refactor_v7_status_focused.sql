-- ==========================================
-- REFACTOR V7: REMOVE WON/LOST STAGES & USE STATUS
-- ==========================================

-- 1. DROP OLD TRIGGERS (Cleanup)
DROP TRIGGER IF EXISTS on_commercial_won ON opportunities;
DROP FUNCTION IF EXISTS public.handle_commercial_won;

-- 2. CREATE NEW TRIGGER ON STATUS CHANGE
CREATE OR REPLACE FUNCTION public.handle_opportunity_status_change()
RETURNS TRIGGER AS $$
DECLARE
    delivery_pipeline_id uuid;
    start_stage_id uuid;
    exists_check uuid;
BEGIN
    -- Handle WON status
    IF NEW.status = 'won' AND OLD.status != 'won' THEN
        NEW.closed_at := NOW();

        -- Check duplicate in delivery
        SELECT id INTO exists_check FROM delivery_opportunities WHERE commercial_opportunity_id = NEW.id LIMIT 1;
        
        IF exists_check IS NULL THEN
            -- Get Delivery Pipeline & Stage
            SELECT id INTO delivery_pipeline_id FROM pipelines WHERE slug = 'delivery';
            
            -- Explicitly select stage ID using table alias 's' to avoid ambiguity
            SELECT s.id INTO start_stage_id 
            FROM stages s
            JOIN pipelines p ON s.pipeline_id = p.id 
            WHERE p.slug = 'delivery' AND s.slug = 'scheduling' LIMIT 1;

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
                    NEW.contact_id, -- Assuming contact_id maps to primary_contact_id
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

    -- Handle LOST status
    IF NEW.status = 'lost' AND OLD.status != 'lost' THEN
        NEW.closed_at := NOW();
        -- No replication logic, just update timestamp
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ATTACH TRIGGER TO STATUS UPDATE
CREATE TRIGGER on_opportunity_status_change
BEFORE UPDATE OF status ON opportunities
FOR EACH ROW
EXECUTE FUNCTION public.handle_opportunity_status_change();

-- 4. REMOVE WON/LOST STAGES (The "Blocks")
-- We move any existing opportunities in these stages to 'closed' status first (safety net)
UPDATE opportunities 
SET status = 'won' 
WHERE stage_id IN (SELECT id FROM stages WHERE slug = 'closed_won');

UPDATE opportunities 
SET status = 'lost' 
WHERE stage_id IN (SELECT id FROM stages WHERE slug = 'closed_lost');

-- Now safe to delete
DELETE FROM stages WHERE slug IN ('closed_won', 'closed_lost');
