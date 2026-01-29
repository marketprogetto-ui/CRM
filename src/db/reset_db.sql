-- SCRIPT DE RESET GERAL (DATA WIPE) - Atualizado
-- Use com cautela! Isso apagará todos os dados de negócio.

-- 1. Limpar tabelas transacionais
-- Usando CASCADE para limpar dependências (ex: proposal_items se existir)
TRUNCATE TABLE 
    opportunities,
    proposals,
    activities,
    delivery_opportunities,
    payment_instructions,
    opportunity_stage_history
RESTART IDENTITY CASCADE;

-- 2. Limpar arquivos do Storage (Bucket 'proposals')
DELETE FROM storage.objects WHERE bucket_id = 'proposals';

-- 3. Confirmação
SELECT 'Banco de dados de teste resetado com sucesso!' as status;
