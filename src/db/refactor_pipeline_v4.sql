-- ==========================================
-- PIPEPLINE REFACTOR V4 (THE "NUCLEAR" FIX)
-- ==========================================

-- 0. SCHEMA SAFETY UPDATES
DO $$
BEGIN
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
    ALTER TABLE delivery_opportunities ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS account_id uuid;
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS contact_id uuid;
    ALTER TABLE delivery_opportunities ADD COLUMN IF NOT EXISTS account_id uuid;
    ALTER TABLE delivery_opportunities ADD COLUMN IF NOT EXISTS primary_contact_id uuid;
    ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS position integer;
END $$;

-- 1. ENSURE TABLES EXIST (Prevent "Relation does not exist" error)
CREATE TABLE IF NOT EXISTS opportunity_stage_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
    stage_id uuid, -- We link to stages later or leniently
    entered_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS payment_instructions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_opportunity_id uuid REFERENCES delivery_opportunities(id) ON DELETE CASCADE,
    commercial_opportunity_id uuid,
    seller_amount numeric,
    supplier_amount numeric,
    installer_amount numeric,
    total_amount numeric,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- 2. WIPE DATA (Eliminate Ghost Data)
TRUNCATE TABLE payment_instructions CASCADE;
TRUNCATE TABLE delivery_opportunities CASCADE;
TRUNCATE TABLE opportunity_stage_history CASCADE;
TRUNCATE TABLE opportunities CASCADE;

-- 2. RESET PIPELINES & STAGES (Ensure Slugs match Trigger)
DELETE FROM stages;
DELETE FROM pipelines;

-- Create Pipelines requesting IDs
DO $$
DECLARE
    comm_id uuid;
    del_id uuid;
BEGIN
    INSERT INTO pipelines (slug, name, position) VALUES ('commercial', 'Comercial', 1) RETURNING id INTO comm_id;
    INSERT INTO pipelines (slug, name, position) VALUES ('delivery', 'Entrega', 2) RETURNING id INTO del_id;

    -- Commercial Stages
    INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES
    (comm_id, 'Prospecção', 'prospecting', 1, 10),
    (comm_id, 'Medição', 'measurement', 2, 30),
    (comm_id, 'Proposta', 'proposal', 3, 60),
    (comm_id, 'Fechamento', 'closing', 4, 80),
    (comm_id, 'Ganho', 'closed_won', 5, 100),   -- Visible as 5th Column
    (comm_id, 'Perdido', 'closed_lost', 98, 0);   -- HIDDEN

    -- Delivery Stages
    INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES
    (del_id, 'Agendamento', 'scheduling', 1, 10),
    (del_id, 'Em Produção', 'production', 2, 40),
    (del_id, 'Instalação', 'installation', 3, 70),
    (del_id, 'Finalizado', 'completed', 4, 100);

END $$;

-- 3. RECREATE AUTOMATION TRIGGER (Handle Commercial Won -> Delivery)
CREATE OR REPLACE FUNCTION public.handle_commercial_won()
RETURNS TRIGGER AS $$
DECLARE
    delivery_pipeline_id uuid;
    start_stage_id uuid;
    exists_check uuid;
BEGIN
    -- Check if the new stage is 'closed_won'
    IF NEW.stage_id IN (SELECT id FROM stages WHERE slug = 'closed_won') THEN
        
        -- Update the status of the commercial opportunity itself
        NEW.status := 'won';
        NEW.closed_at := NOW();

        -- Check if it already exists in Delivery to prevent duplication
        SELECT id INTO exists_check FROM delivery_opportunities WHERE commercial_opportunity_id = NEW.id LIMIT 1;
        
        IF exists_check IS NULL THEN
            -- Get Delivery Pipeline ID
            SELECT id INTO delivery_pipeline_id FROM pipelines WHERE slug = 'delivery';
            
            -- Get First Stage of Delivery (scheduling)
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
                    NEW.contact_id,
                    COALESCE(NEW.amount_final, NEW.amount_offered, NEW.amount_estimated),
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

    -- Handle 'closed_lost' status update
    IF NEW.stage_id IN (SELECT id FROM stages WHERE slug = 'closed_lost') THEN
        NEW.status := 'lost';
        NEW.closed_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach Trigger
DROP TRIGGER IF EXISTS on_commercial_won ON opportunities;
CREATE TRIGGER on_commercial_won
BEFORE UPDATE OF stage_id ON opportunities
FOR EACH ROW
EXECUTE FUNCTION public.handle_commercial_won();
