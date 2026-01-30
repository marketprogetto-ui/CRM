-- REFACTOR PIPELINE V2 (FULL RESTRUCTURE)
-- 1. Updates Stage Definitions
-- 2. Migrates existing Opportunities to new stages
-- 3. Sets up Automation Trigger (Commercial Won -> Delivery)

DO $$
DECLARE
    comm_id uuid;
    del_id uuid;
    
    -- Commercial Stage IDs
    s_comm_prospec uuid;
    s_comm_medicao uuid;
    s_comm_proposta uuid;
    s_comm_fechamento uuid;
    s_comm_won uuid;
    s_comm_lost uuid;

    -- Delivery Stage IDs
    s_del_agendamento uuid;
    s_del_producao uuid;
    s_del_instalacao uuid;
    s_del_finalizado uuid;
BEGIN
    -- Get Pipeline IDs
    SELECT id INTO comm_id FROM pipelines WHERE slug = 'commercial';
    SELECT id INTO del_id FROM pipelines WHERE slug = 'delivery';

    IF comm_id IS NULL OR del_id IS NULL THEN
        RAISE EXCEPTION 'Pipelines not found. Please run seed first.';
    END IF;

    -------------------------------------------------------------------------
    -- 1. DEFINE NEW STAGES (Upserting to preserve IDs if slugs match, else creating)
    -------------------------------------------------------------------------

    -- COMMERCIAL STAGES --
    
    -- 1. Prospecção
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (comm_id, 'Prospecção', 'prospecting', 1, 10)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Prospecção', position = 1, probability = 10
    RETURNING id INTO s_comm_prospec;

    -- 2. Medição (Was Qualification? Remap or Create)
    -- We'll use a new slug 'measurement' for clarity.
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (comm_id, 'Medição', 'measurement', 2, 30)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Medição', position = 2, probability = 30
    RETURNING id INTO s_comm_medicao;

    -- 3. Proposta (New slug 'proposal')
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (comm_id, 'Proposta', 'proposal', 3, 60)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Proposta', position = 3, probability = 60
    RETURNING id INTO s_comm_proposta;

    -- 4. Fechamento (New slug 'closing')
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (comm_id, 'Fechamento', 'closing', 4, 80)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Fechamento', position = 4, probability = 80
    RETURNING id INTO s_comm_fechamento;

    -- Hidden: Won
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (comm_id, 'Ganho', 'closed_won', 99, 100)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Ganho', position = 99, probability = 100
    RETURNING id INTO s_comm_won;

    -- Hidden: Lost
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (comm_id, 'Perdido', 'closed_lost', 98, 0)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Perdido', position = 98, probability = 0
    RETURNING id INTO s_comm_lost;


    -- DELIVERY STAGES --

    -- 1. Agendamento (Old logic had 'measurement_scheduling', map to this?)
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (del_id, 'Agendamento', 'scheduling', 1, 0)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Agendamento', position = 1
    RETURNING id INTO s_del_agendamento;

    -- 2. Em Produção
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (del_id, 'Em Produção', 'production', 2, 0)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Em Produção', position = 2
    RETURNING id INTO s_del_producao;

    -- 3. Instalação
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (del_id, 'Instalação', 'installation', 3, 0)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Instalação', position = 3
    RETURNING id INTO s_del_instalacao;

    -- 4. Finalizado
    INSERT INTO stages (pipeline_id, name, slug, position, probability)
    VALUES (del_id, 'Finalizado', 'completed', 4, 100)
    ON CONFLICT (pipeline_id, slug) DO UPDATE SET name = 'Finalizado', position = 4
    RETURNING id INTO s_del_finalizado;

    -------------------------------------------------------------------------
    -- 2. MIGRATE OLD STAGES (Cleanup)
    -------------------------------------------------------------------------
    -- Map old Commercial slugs to new ones
    UPDATE opportunities SET stage_id = s_comm_prospec WHERE stage_id IN (SELECT id FROM stages WHERE pipeline_id = comm_id AND slug NOT IN ('prospecting', 'measurement', 'proposal', 'closing', 'closed_won', 'closed_lost'));
    
    -- Map old Delivery slugs to new ones
    UPDATE delivery_opportunities SET stage_id = s_del_agendamento WHERE stage_id IN (SELECT id FROM stages WHERE pipeline_id = del_id AND slug NOT IN ('scheduling', 'production', 'installation', 'completed'));

    -- Delete obsolete stages to clean up
    DELETE FROM stages 
    WHERE pipeline_id = comm_id 
    AND slug NOT IN ('prospecting', 'measurement', 'proposal', 'closing', 'closed_won', 'closed_lost');

    DELETE FROM stages 
    WHERE pipeline_id = del_id 
    AND slug NOT IN ('scheduling', 'production', 'installation', 'completed');

END $$;

-------------------------------------------------------------------------
-- 3. AUTOMATION TRIGGER (Commercial Won -> Delivery)
-------------------------------------------------------------------------

-- Function to handle the duplication
CREATE OR REPLACE FUNCTION public.handle_commercial_won()
RETURNS TRIGGER AS $$
DECLARE
    delivery_pipeline_id uuid;
    start_stage_id uuid;
    exists_check uuid;
BEGIN
    -- Only proceed if transitioning TO 'closed_won' stage
    -- We need to check if the new stage is 'closed_won'
    IF NEW.stage_id = (SELECT id FROM stages WHERE slug = 'closed_won' AND pipeline_id = NEW.pipeline_id) THEN
        
        -- Check if delivery opportunity already exists for this commercial opportunity
        SELECT id INTO exists_check FROM delivery_opportunities WHERE commercial_opportunity_id = NEW.id LIMIT 1;
        
        IF exists_check IS NULL THEN
            -- Get Delivery Pipeline config
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
                    created_at,
                    updated_at
                ) VALUES (
                    NEW.id,
                    NEW.title,
                    NEW.owner_id,
                    NEW.account_id,
                    NEW.contact_id, -- mapped to primary_contact_id
                    COALESCE(NEW.amount_final, NEW.amount_offered, NEW.amount_estimated),
                    start_stage_id,
                    delivery_pipeline_id,
                    'pending',
                    NOW(),
                    NOW()
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger (Idempotent)
DROP TRIGGER IF EXISTS on_commercial_won ON opportunities;
CREATE TRIGGER on_commercial_won
AFTER UPDATE OF stage_id ON opportunities
FOR EACH ROW
WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
EXECUTE FUNCTION public.handle_commercial_won();
