-- SCRIPT DE RESET GERAL (DATA WIPE)
-- Use com cautela! Isso apagará todos os dados de negócio.

-- 1. Limpar tabelas transacionais (Oportunidades, Atividades, Propostas, etc.)
TRUNCATE TABLE 
    payment_instructions,
    delivery_opportunities,
    activities,
    proposal_items,
    proposals,
    opportunity_stage_history,
    opportunities
CASCADE;

-- 2. Limpar arquivos do Storage (Bucket 'proposals')
DELETE FROM storage.objects WHERE bucket_id = 'proposals';

-- OBS: Não estamos apagando 'pipelines', 'stages' ou 'profiles' para não quebrar a configuração base inicial.
-- Se quiser realmente zerar até as configurações, descomente abaixo:
-- TRUNCATE TABLE stages, pipelines CASCADE;
-- Depois rode o refactor_crm.sql novamente para recriá-los.

-- 3. Confirmação
SELECT 'Banco de dados de teste resetado com sucesso!' as status;
