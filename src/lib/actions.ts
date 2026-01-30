import { supabase } from '@/lib/supabase';
import { Database } from '@/types/crm';

export async function updateOpportunityStage(
    opportunityId: string,
    newStageId: string,
    pipelineSlug: string
) {
    const { data: opportunity, error: fetchError } = await supabase
        .from('opportunities')
        .select('*, stages(slug)')
        .eq('id', opportunityId)
        .single();

    if (fetchError || !opportunity) throw new Error('Oportunidade não encontrada');

    const { data: newStage, error: stageError } = await supabase
        .from('stages')
        .select('*')
        .eq('id', newStageId)
        .single();

    if (stageError || !newStage) throw new Error('Estágio inválido');

    const { error: updateError } = await supabase
        .from('opportunities')
        .update({
            stage_id: newStageId,
            updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);

    if (updateError) throw updateError;

    await supabase.from('opportunity_stage_history').insert({
        opportunity_id: opportunityId,
        stage_id: newStageId,
        entered_at: new Date().toISOString()
    });
}

export async function updateOpportunityStatus(
    opportunityId: string,
    status: 'won' | 'lost' | 'active',
    lossReason?: string,
    pipelineSlug: string = 'commercial'
) {
    const updateData: any = {
        status,
        updated_at: new Date().toISOString()
    };

    if (status === 'lost' && lossReason) {
        updateData.loss_reason = lossReason;
    }

    if (status === 'won' || status === 'lost') {
        updateData.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('opportunities')
        .update(updateData)
        .eq('id', opportunityId);

    if (error) throw error;
}
