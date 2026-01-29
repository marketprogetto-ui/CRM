-- SCRIPT DE RESET GERAL (DATA WIPE) - Versão Segura
-- Remove apenas tabelas confirmadas no schema de produção atual.

-- 1. Limpar tabelas principais (CASCADE apagará dados vinculados em outras tabelas se houver chaves estrangeiras)
TRUNCATE TABLE 
    opportunities,
    proposals,
    activities,
    delivery_opportunities,
    payment_instructions
RESTART IDENTITY CASCADE;

-- 2. Limpar arquivos do Storage (Bucket 'proposals')
DELETE FROM storage.objects WHERE bucket_id = 'proposals';

-- 3. Confirmação
SELECT 'Banco de dados resetado com sucesso! Tabelas limpas: opportunities, proposals, activities, delivery_opportunities, payment_instructions.' as status;
