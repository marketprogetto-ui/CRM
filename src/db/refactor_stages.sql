-- REFACTOR STAGES (Correction for missing UNIQUE constraint)
-- We use PL/pgSQL to check for existence manually instead of ON CONFLICT

DO $$
DECLARE
    comm_id uuid;
    del_id uuid;
BEGIN
    SELECT id INTO comm_id FROM pipelines WHERE slug = 'commercial';
    SELECT id INTO del_id FROM pipelines WHERE slug = 'delivery';

    -- COMMERCIAL STAGES --

    -- 1. Prospecção
    UPDATE stages SET name = 'Prospecção', position = 1, probability = 25 WHERE pipeline_id = comm_id AND slug = 'prospecting';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (comm_id, 'Prospecção', 'prospecting', 1, 25);
    END IF;

    -- 2. Qualificação
    UPDATE stages SET name = 'Qualificação', position = 2, probability = 25 WHERE pipeline_id = comm_id AND slug = 'qualification';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (comm_id, 'Qualificação', 'qualification', 2, 25);
    END IF;

    -- 3. Visita / Medição / Proposta
    UPDATE stages SET name = 'Visita / Medição / Proposta', position = 3, probability = 25 WHERE pipeline_id = comm_id AND slug = 'visit_proposal';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (comm_id, 'Visita / Medição / Proposta', 'visit_proposal', 3, 25);
    END IF;

    -- 4. Negociação / Fechamento
    UPDATE stages SET name = 'Negociação / Fechamento', position = 4, probability = 25 WHERE pipeline_id = comm_id AND slug = 'negotiation_closing';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (comm_id, 'Negociação / Fechamento', 'negotiation_closing', 4, 25);
    END IF;

    -- Hidden: Won
    UPDATE stages SET name = 'Ganho', position = 99, probability = 100 WHERE pipeline_id = comm_id AND slug = 'closed_won';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (comm_id, 'Ganho', 'closed_won', 99, 100);
    END IF;

    -- Hidden: Lost
    UPDATE stages SET name = 'Perdido', position = 98, probability = 0 WHERE pipeline_id = comm_id AND slug = 'closed_lost';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (comm_id, 'Perdido', 'closed_lost', 98, 0);
    END IF;


    -- DELIVERY STAGES --

    -- 1. Medição / Agendamento
    UPDATE stages SET name = 'Medição / Agendamento', position = 1, probability = 25 WHERE pipeline_id = del_id AND slug = 'measurement_scheduling';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (del_id, 'Medição / Agendamento', 'measurement_scheduling', 1, 25);
    END IF;

    -- 2. Produção / Trânsito
    UPDATE stages SET name = 'Produção / Trânsito', position = 2, probability = 25 WHERE pipeline_id = del_id AND slug = 'production_transit';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (del_id, 'Produção / Trânsito', 'production_transit', 2, 25);
    END IF;

    -- 3. Instalação
    UPDATE stages SET name = 'Instalação', position = 3, probability = 25 WHERE pipeline_id = del_id AND slug = 'installation';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (del_id, 'Instalação', 'installation', 3, 25);
    END IF;

    -- 4. Finalizado
    UPDATE stages SET name = 'Finalizado', position = 4, probability = 100 WHERE pipeline_id = del_id AND slug = 'completed';
    IF NOT FOUND THEN
        INSERT INTO stages (pipeline_id, name, slug, position, probability) VALUES (del_id, 'Finalizado', 'completed', 4, 100);
    END IF;

END $$;
