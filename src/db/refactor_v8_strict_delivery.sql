-- ==========================================
-- REFACTOR V8: STRICT DELIVERY TRIGGER & CLEANUP
-- ==========================================

-- 1. CLEANUP OLD TRIGGERS
DROP TRIGGER IF EXISTS on_commercial_won ON opportunities;
DROP TRIGGER IF EXISTS on_opportunity_status_change ON opportunities;
DROP FUNCTION IF EXISTS public.handle_commercial_won;
DROP FUNCTION IF EXISTS public.handle_opportunity_status_change;

-- 2. CREATE STRICT TRIGGER FUNCTION
-- Premise: Commercial Pipeline -> Stage "Fechamento" (closing) -> Status "won" => Replicate to Delivery
CREATE OR REPLACE FUNCTION public.handle_commercial_completion()
RETURNS TRIGGER AS $$
DECLARE
    delivery_pipeline_id uuid;
    start_stage_id uuid;
    closing_stage_id uuid;
    exists_check uuid;
    is_closing_stage boolean;
BEGIN
    -- Only act if status changed to 'won' OR 'lost'
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        
        -- HANDLE WON
        IF NEW.status = 'won' THEN
            NEW.closed_at := NOW();

            -- Check if current stage is 'closing' (Fechamento)
            SELECT id INTO closing_stage_id FROM stages 
            WHERE slug = 'closing' AND pipeline_id = NEW.pipeline_id LIMIT 1;
            
            -- If user strictly wants only 'Fechamento', we check ID.
            -- Using lenient check: If stage is 'closing' OR we decide to allow global wins. 
            -- User said: "alcançar o estágio de fechamento ... com status ganho"
            -- enforcing strict check:
            IF NEW.stage_id = closing_stage_id THEN
                
                -- Check duplication
                SELECT id INTO exists_check FROM delivery_opportunities WHERE commercial_opportunity_id = NEW.id LIMIT 1;
                
                IF exists_check IS NULL THEN
                    -- Get Delivery Pipeline Info
                    SELECT id INTO delivery_pipeline_id FROM pipelines WHERE slug = 'delivery';
                    
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
                            NEW.contact_id, 
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
        END IF;

        -- HANDLE LOST
        IF NEW.status = 'lost' THEN
            NEW.closed_at := NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY TRIGGER
CREATE TRIGGER on_commercial_completion
BEFORE UPDATE OF status ON opportunities
FOR EACH ROW
EXECUTE FUNCTION public.handle_commercial_completion();
