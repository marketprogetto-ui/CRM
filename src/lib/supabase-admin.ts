
import { createClient } from '@supabase/supabase-js';

// NOTA: A chave SERVICE_ROLE é necessária para operações de admin (invite, delete, etc.)
// Nunca exponha essa chave no lado do cliente (use apenas em arquivos no servidor ou server actions).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    // Em desenvolvimento local sem a chave, algumas funções falharão.
    // Pode ser útil logar um aviso.
    console.warn('Supabase Admin: Service Role Key faltando. Operações administrativas falharão.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
