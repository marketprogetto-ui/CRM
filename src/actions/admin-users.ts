'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

/**
 * Convida um usuário por e-mail para a organização/projeto Supabase.
 * Isso envia um e-mail oficial do Supabase (se configurado) ou gera um link.
 */
export async function inviteUser(email: string) {
    try {
        if (!email) return { error: 'E-mail é obrigatório.' };

        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

        if (error) {
            console.error('Erro ao convidar usuário:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/users');
        return { success: true, message: `Convite enviado para ${email}!` };
    } catch (err) {
        console.error('Erro inesperado no inviteUser:', err);
        return { error: 'Ocorreu um erro inesperado ao convidar o usuário.' };
    }
}

/**
 * Exclui um usuário do Authentication e (por cascade) das tabelas relacionais se configurado.
 */
export async function deleteUser(userId: string) {
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Erro ao excluir usuário:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/users');
        return { success: true, message: 'Usuário excluído com sucesso.' };
    } catch (err) {
        console.error('Erro inesperado no deleteUser:', err);
        return { error: 'Erro ao tentar excluir o usuário.' };
    }
}

/**
 * Atualiza o cargo (role) de um usuário na tabela public.profiles.
 * Bypassa RLS pois usa supabaseAdmin.
 */
export async function updateUserRole(userId: string, newRole: string) {
    try {
        // Validação básica de roles permitidas
        if (!['admin', 'user'].includes(newRole)) {
            return { error: 'Role inválida.' };
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            console.error('Erro ao atualizar cargo:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/users');
        return { success: true, message: 'Permissão atualizada com sucesso.' };
    } catch (err) {
        console.error('Erro inesperado no updateUserRole:', err);
        return { error: 'Erro ao atualizar permissão.' };
    }
}
