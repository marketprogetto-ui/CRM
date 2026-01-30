import { createBrowserClient } from '@supabase/ssr';

// Fallback para evitar erro de build caso variáveis não estejam carregadas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
