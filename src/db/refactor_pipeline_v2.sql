-- REFACTOR PIPELINE V2 (FULL RESTRUCTURE) - CORRECTED
-- 1. Updates Stage Definitions (Manual Upsert to avoid unique constraint issues)
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
    -- 1. DEFINE NEW STAGES (Manual Upsert)
    -------------------------------------------------------------------------

    -- COMMERCIAL STAGES --
    
    -- 1. Prospecção (10%)
    UPDATE stages SET name = 'Prospecção', position = 1, probability = 10, slug = 'prospecting' 
    WHERE pipeline_id = comm_id AND slug = 'prospecting'
    RETURNING id INTO s_comm_prospec;
    
    IF s_comm_prospec IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (comm_id, 'Prospecção', 'prospecting', 1, 10)
        RETURNING id INTO s_comm_prospec;
    END IF;

    -- 2. Medição (30%)
    UPDATE stages SET name = 'Medição', position = 2, probability = 30, slug = 'measurement'
    WHERE pipeline_id = comm_id AND slug = 'measurement'
    RETURNING id INTO s_comm_medicao;

    IF s_comm_medicao IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (comm_id, 'Medição', 'measurement', 2, 30)
        RETURNING id INTO s_comm_medicao;
    END IF;

    -- 3. Proposta (60%)
    UPDATE stages SET name = 'Proposta', position = 3, probability = 60, slug = 'proposal'
    WHERE pipeline_id = comm_id AND slug = 'proposal'
    RETURNING id INTO s_comm_proposta;

    IF s_comm_proposta IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (comm_id, 'Proposta', 'proposal', 3, 60)
        RETURNING id INTO s_comm_proposta;
    END IF;

    -- 4. Fechamento (80%)
    UPDATE stages SET name = 'Fechamento', position = 4, probability = 80, slug = 'closing'
    WHERE pipeline_id = comm_id AND slug = 'closing'
    RETURNING id INTO s_comm_fechamento;

    IF s_comm_fechamento IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (comm_id, 'Fechamento', 'closing', 4, 80)
        RETURNING id INTO s_comm_fechamento;
    END IF;

    -- Hidden: Won (100%)
    UPDATE stages SET name = 'Ganho', position = 99, probability = 100, slug = 'closed_won'
    WHERE pipeline_id = comm_id AND slug = 'closed_won'
    RETURNING id INTO s_comm_won;

    IF s_comm_won IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (comm_id, 'Ganho', 'closed_won', 99, 100)
        RETURNING id INTO s_comm_won;
    END IF;

    -- Hidden: Lost (0%)
    UPDATE stages SET name = 'Perdido', position = 98, probability = 0, slug = 'closed_lost'
    WHERE pipeline_id = comm_id AND slug = 'closed_lost'
    RETURNING id INTO s_comm_lost;

    IF s_comm_lost IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (comm_id, 'Perdido', 'closed_lost', 98, 0)
        RETURNING id INTO s_comm_lost;
    END IF;


    -- DELIVERY STAGES --

    -- 1. Agendamento
    UPDATE stages SET name = 'Agendamento', position = 1, slug = 'scheduling'
    WHERE pipeline_id = del_id AND slug = 'scheduling'
    RETURNING id INTO s_del_agendamento;

    IF s_del_agendamento IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (del_id, 'Agendamento', 'scheduling', 1, 0)
        RETURNING id INTO s_del_agendamento;
    END IF;

    -- 2. Em Produção
    UPDATE stages SET name = 'Em Produção', position = 2, slug = 'production'
    WHERE pipeline_id = del_id AND slug = 'production'
    RETURNING id INTO s_del_producao;

    IF s_del_producao IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (del_id, 'Em Produção', 'production', 2, 0)
        RETURNING id INTO s_del_producao;
    END IF;

    -- 3. Instalação
    UPDATE stages SET name = 'Instalação', position = 3, slug = 'installation'
    WHERE pipeline_id = del_id AND slug = 'installation'
    RETURNING id INTO s_del_instalacao;

    IF s_del_instalacao IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (del_id, 'Instalação', 'installation', 3, 0)
        RETURNING id INTO s_del_instalacao;
    END IF;

    -- 4. Finalizado
    UPDATE stages SET name = 'Finalizado', position = 4, slug = 'completed', probability = 100
    WHERE pipeline_id = del_id AND slug = 'completed'
    RETURNING id INTO s_del_finalizado;

    IF s_del_finalizado IS NULL THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability)
        VALUES (del_id, 'Finalizado', 'completed', 4, 100)
        RETURNING id INTO s_del_finalizado;
    END IF;

    -------------------------------------------------------------------------
    -- 2. MIGRATE OLD STAGES (Cleanup)
    -------------------------------------------------------------------------
    -- Map old Commercial slugs to new ones (Default to Prospecting if unknown)
    UPDATE opportunities SET stage_id = s_comm_prospec WHERE stage_id IN (SELECT id FROM stages WHERE pipeline_id = comm_id AND slug NOT IN ('prospecting', 'measurement', 'proposal', 'closing', 'closed_won', 'closed_lost'));
    
    -- Map old Delivery slugs to new ones (Default to Scheduling if unknown)
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
    IF NEW.stage_id = (SELECT id FROM stages WHERE slug = 'closed_won' AND pipeline_id = NEW.pipeline_id LIMIT 1) THEN
        
        -- Check if delivery opportunity already exists for this commercial opportunity
        SELECT id INTO exists_check FROM delivery_opportunities WHERE commercial_opportunity_id = NEW.id LIMIT 1;
        
        IF exists_check IS NULL THEN
            -- Get Delivery Pipeline config
            SELECT id INTO delivery_pipeline_id FROM pipelines WHERE slug = 'delivery' LIMIT 1;
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
                    NEW.contact_id,
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
