'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function inviteUser(email: string) {
    if (!email) {
        return { error: 'E-mail é obrigatório' };
    }

    try {
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: 'https://progetto-crm.vercel.app/profile', // Customize as needed
        });

        if (error) {
            console.error('Erro ao convidar usuário:', error);
            return { error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('Erro inesperado:', err);
        return { error: err.message };
    }
}
