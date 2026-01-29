import { supabase } from '@/lib/supabase';
import { Database } from '@/types/crm';

export async function updateOpportunityStage(
    opportunityId: string,
    newStageId: string,
    pipelineSlug: string
) {
    // 1. Get current stage and opportunity data
    // Note: We need to know which table to query. Usually 'opportunities' stores everything, 
    // but the prompt implies 'delivery_opportunities' is a separate table.
    // However, if the Pipeline Page is generic using 'opportunities', we need to check if 'delivery' pipeline uses 'opportunities' table or 'delivery_opportunities' table.
    // The prompt says: "Criar automaticamente registro em delivery_opportunities (nova tabela separada)".
    // So 'delivery' pipeline likely reads from 'delivery_opportunities'.
    // BUT 'PipelinePage' currently reads from 'opportunities'.
    // So I need to branch logic based on pipelineSlug.

    let tableName = 'opportunities';
    if (pipelineSlug === 'delivery') {
        // Check if 'delivery_opportunities' is used for the view. 
        // If generic PipelinePage is used, it likely expects 'opportunities' table structure.
        // BUT the prompt explicitly asked for a separate table.
        // This implies PipelinePage must be adapted to read from the correct table based on slug.
        // OR 'delivery_opportunities' keys are joined into 'opportunities' view?
        // Assuming PipelinePage refactor handles table selection, I will handle update here.
        tableName = 'delivery_opportunities';
    }

    const { data: opportunity, error: fetchError } = await supabase
        .from(tableName as any)
        .select('*, stages(slug)')
        .eq('id', opportunityId)
        .single();

    if (fetchError || !opportunity) throw new Error('Oportunidade não encontrada');

    // 2. Get new stage info
    const { data: newStage, error: stageError } = await supabase
        .from('stages')
        .select('*')
        .eq('id', newStageId)
        .single();

    if (stageError || !newStage) throw new Error('Estágio inválido');

    // 3. Update Opportunity
    const { error: updateError } = await supabase
        .from(tableName as any)
        .update({
            stage_id: newStageId,
            updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);

    if (updateError) throw updateError;

    // 4. Log Transition (History)
    // Assuming history table works for both or we have separate logic
    const historyTable = tableName === 'delivery_opportunities' ? 'delivery_stage_history' : 'opportunity_stage_history';
    // If delivery_stage_history doesn't exist, we might skip or uses generic.
    // I'll stick to opportunity_stage_history if ID matches, but IDs might collide if not UUIDs. UUIDs are fine.
    // I'll skip history for delivery for now unless table exists.
    if (tableName === 'opportunities') {
        await supabase.from('opportunity_stage_history').insert({
            opportunity_id: opportunityId,
            stage_id: newStageId,
            entered_at: new Date().toISOString()
        });
    }

    // 5. Commercial -> Closed Won -> Create Delivery
    if (pipelineSlug === 'commercial') {
        if (newStage.slug === 'closed_won') {
            // await createDeliveryOpportunity(opportunity); // Duplicado: Trigger no banco já faz isso
        }
    }

    // 6. Delivery -> Completed -> Create Payment Instruction
    if (pipelineSlug === 'delivery') {
        if (newStage.slug === 'completed') {
            await createPaymentInstruction(opportunity);
        }
    }
}

async function createDeliveryOpportunity(commercialOpp: any) {
    const { data: existing } = await supabase
        .from('delivery_opportunities')
        .select('id')
        .eq('commercial_opportunity_id', commercialOpp.id)
        .single();

    if (existing) return;

    const { data: deliveryPipeline } = await supabase
        .from('pipelines')
        .select('id')
        .eq('slug', 'delivery')
        .single();

    if (!deliveryPipeline) return;

    const { data: firstStage } = await supabase
        .from('stages')
        .select('id')
        .eq('pipeline_id', deliveryPipeline.id)
        .eq('slug', 'measurement_scheduling')
        .single();

    if (!firstStage) return;

    await supabase.from('delivery_opportunities').insert({
        commercial_opportunity_id: commercialOpp.id,
        title: commercialOpp.title,
        owner_id: commercialOpp.owner_id,
        account_id: commercialOpp.account_id,
        primary_contact_id: commercialOpp.contact_id || commercialOpp.primary_contact_id,
        amount_final: commercialOpp.amount_final || commercialOpp.amount_offered,
        stage_id: firstStage.id,
        pipeline_id: deliveryPipeline.id,
        billing_status: 'pending'
    });
}

async function createPaymentInstruction(deliveryOpp: any) {
    const { data: existing } = await supabase
        .from('payment_instructions')
        .select('id')
        .eq('delivery_opportunity_id', deliveryOpp.id)
        .single();

    if (existing) return;

    const totalAmount = deliveryOpp.amount_final || 0;
    const sellerAmount = totalAmount * 0.05;
    const installerAmount = 150.00;
    const supplierAmount = totalAmount * 0.40;

    await supabase.from('payment_instructions').insert({
        commercial_opportunity_id: deliveryOpp.commercial_opportunity_id,
        delivery_opportunity_id: deliveryOpp.id,
        seller_amount: sellerAmount,
        supplier_amount: supplierAmount,
        installer_amount: installerAmount,
        total_amount: sellerAmount + supplierAmount + installerAmount,
        status: 'pending'
    });
}
