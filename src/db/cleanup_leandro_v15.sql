-- ==========================================
-- SCRIPT V15: CLEANUP CORRUPTED USER LEANDRO
-- ==========================================

-- O erro "Database error querying schema" para um usuário específico indica inconsistência
-- nos dados inseridos manualmente nas tabelas internas de autenticação (auth.users/identities).
-- A melhor e mais segura correção é REMOVER o registro quebrado para permitir um cadastro limpo.

DO $$
BEGIN
    -- 1. Remove Identity (Link com provedor de email)
    DELETE FROM auth.identities WHERE email = 'leandro.profissional@yahoo.com.br';
    
    -- 2. Remove Profile (Dados da aplicação)
    DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'leandro.profissional@yahoo.com.br');
    
    -- 3. Remove User (Conta de acesso)
    DELETE FROM auth.users WHERE email = 'leandro.profissional@yahoo.com.br';
    
    RAISE NOTICE 'Usuário Leandro removido com sucesso. Pronto para recadastro limpo.';
END $$;
