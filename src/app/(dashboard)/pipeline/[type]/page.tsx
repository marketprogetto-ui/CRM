'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreVertical,
    Plus,
    Search,
    Filter,
    ArrowUpRight,
    Clock,
    User,
    DollarSign,
    AlertCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils-crm';
import { NewOpportunityModal } from '@/components/crm/new-opportunity-modal';

interface Stage {
    id: string;
    name: string;
    slug: string;
    position: number;
}

interface Opportunity {
    id: string;
    title: string;
    amount_estimated: number;
    amount_offered: number;
    amount_final: number;
    stage_id: string;
    priority: string;
    owner?: { full_name: string };
    source?: string;
}

export default function PipelinePage() {
    const { type } = useParams();
    const router = useRouter();
    const [stages, setStages] = useState<Stage[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [type]);

    const fetchData = async () => {
        setLoading(true);

        // Fetch pipeline
        const { data: pipelineData } = await supabase
            .from('pipelines')
            .select('id')
            .eq('slug', type)
            .single();

        if (!pipelineData) {
            setLoading(false);
            return;
        }

        // Fetch stages
        const { data: stagesData } = await supabase
            .from('stages')
            .select('*')
            .eq('pipeline_id', pipelineData.id)
            .order('position', { ascending: true });

        setStages(stagesData || []);

        // Fetch opportunities
        const { data: oppsData } = await supabase
            .from('opportunities')
            .select('*, profiles(full_name)')
            .eq('pipeline_id', pipelineData.id);

        setOpportunities(oppsData || []);
        setLoading(false);
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Optimistic update
        const updatedOpps = [...opportunities];
        const oppIndex = updatedOpps.findIndex(o => o.id === draggableId);
        if (oppIndex !== -1) {
            updatedOpps[oppIndex].stage_id = destination.droppableId;
            setOpportunities(updatedOpps);
        }

        // DB Update
        const { error } = await supabase
            .from('opportunities')
            .update({ stage_id: destination.droppableId })
            .eq('id', draggableId);

        if (error) {
            console.error('Error updating stage:', error);
            // Revert if error (optional, for brevity I'll just log and maybe show a toast)
            // fetchInitialData(); 
            alert(`Erro ao mover: ${error.message}`);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white capitalize">Pipeline {type}</h1>
                    <p className="text-slate-400 text-sm">Gerencie suas oportunidades e acompanhe o progresso.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar oportunidade..."
                            className="pl-10 bg-slate-900 border-slate-800 text-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Oportunidade
                    </Button>
                </div>
            </div>

            <NewOpportunityModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                pipelineSlug={type as string}
                onSuccess={fetchData}
            />

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {stages.map((stage) => (
                        <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-200">{stage.name}</h3>
                                    <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-none">
                                        {opportunities.filter(o => o.stage_id === stage.id).length}
                                    </Badge>
                                </div>
                                <MoreVertical className="w-4 h-4 text-slate-600" />
                            </div>

                            <Droppable droppableId={stage.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex-1 overflow-y-auto px-3 pb-3 min-h-[150px]"
                                    >
                                        {opportunities
                                            .filter(o => o.stage_id === stage.id)
                                            .filter(o => o.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map((opp, index) => (
                                                <Draggable key={opp.id} draggableId={opp.id} index={index}>
                                                    {(provided) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="mb-3 bg-slate-800/80 border-slate-700 hover:border-indigo-500/50 transition-all cursor-grab active:cursor-grabbing group shadow-lg hover:shadow-indigo-500/5"
                                                            onClick={() => router.push(`/opportunities/${opp.id}`)}
                                                        >
                                                            <CardContent className="p-4 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="font-medium text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-2">
                                                                        {opp.title}
                                                                    </h4>
                                                                    <Badge className={`${opp.priority === 'high' ? 'bg-red-900/30 text-red-400 border-red-900/50' :
                                                                        opp.priority === 'medium' ? 'bg-orange-900/30 text-orange-400 border-orange-900/50' :
                                                                            'bg-green-900/30 text-green-400 border-green-900/50'
                                                                        } border font-medium text-[10px] uppercase tracking-wider`}>
                                                                        {opp.priority}
                                                                    </Badge>
                                                                </div>

                                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-700/50">
                                                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                                                        <DollarSign className="w-3 h-3" />
                                                                        <span className="font-semibold text-slate-200">
                                                                            {formatCurrency(opp.amount_final || opp.amount_offered || opp.amount_estimated || 0)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {opp.owner && (
                                                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-600" title={opp.owner.full_name}>
                                                                                {opp.owner.full_name.substring(0, 1)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
