'use client';

import PipelineActivitiesList from '@/components/crm/pipeline-activities-list';

export const dynamic = 'force-dynamic';

export default function DeliveryActivitiesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Atividades de Entrega</h1>
                <p className="text-slate-400 text-xs md:text-sm">Acompanhe tarefas de produção e instalação.</p>
            </div>
            <PipelineActivitiesList pipelineSlug="delivery" />
        </div>
    );
}
