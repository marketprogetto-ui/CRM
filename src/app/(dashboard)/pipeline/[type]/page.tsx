'use client';

export const dynamic = 'force-dynamic';

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
    AlertCircle,
    FileText,
    MoreHorizontal,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils-crm';
import { updateOpportunityStage } from '@/lib/actions';
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
    proposal_sent_at?: string;
}

export default function PipelinePage() {
    const { type } = useParams();
    const router = useRouter();
    const [stages, setStages] = useState<Stage[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchPipelineData();
    }, [type]);

    const fetchPipelineData = async () => {
        setLoading(true);

        try {
            // 1. Fetch Pipeline ID
            const { data: pipelineData, error: pipelineError } = await supabase
                .from('pipelines')
                .select('id')
                .eq('slug', type)
                .single();

            if (pipelineError || !pipelineData) {
                console.error('Pipeline not found', pipelineError);
                setLoading(false);
                return;
            }

            // 2. Parallel Fetch: Stages + Opportunities (Optimized Select)
            const commonColumns = 'id, title, amount_estimated, amount_offered, amount_final, stage_id, priority, source, proposal_sent_at, owner_id';

            const stagesPromise = supabase
                .from('stages')
                .select('id, name, slug, position')
                .eq('pipeline_id', pipelineData.id)
                .order('position', { ascending: true });

            let oppsPromise;
            if (type === 'delivery') {
                oppsPromise = supabase
                    .from('delivery_opportunities')
                    .select(`${commonColumns}, profiles(full_name)`)
                    .eq('pipeline_id', pipelineData.id);
            } else {
                oppsPromise = supabase
                    .from('opportunities')
                    .select(`${commonColumns}, profiles(full_name)`)
                    .eq('pipeline_id', pipelineData.id);
            }

            const [stagesResult, oppsResult] = await Promise.all([stagesPromise, oppsPromise]);

            if (stagesResult.error) console.error('Error fetching stages', stagesResult.error);
            if (oppsResult.error) console.error('Error fetching opportunities', oppsResult.error);

            setStages(stagesResult.data || []);

            // Normalize data
            const oppsData = oppsResult.data || [];
            const normalizedOpps: Opportunity[] = oppsData.map((o: any) => ({
                id: o.id,
                title: o.title,
                amount_estimated: o.amount_estimated || 0,
                amount_offered: o.amount_offered || 0,
                amount_final: o.amount_final || 0,
                stage_id: o.stage_id,
                priority: o.priority || 'medium',
                owner: o.profiles || o.owner,
                source: o.source,
                proposal_sent_at: o.proposal_sent_at
            }));

            setOpportunities(normalizedOpps);
        } catch (err) {
            console.error('Unexpected error loading pipeline', err);
        } finally {
            setLoading(false);
        }
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

        try {
            await updateOpportunityStage(draggableId, destination.droppableId, type as string);
        } catch (error: any) {
            console.error('Error updating stage:', error);
            alert(`Erro ao atualizar estágio: ${error.message}`);
            fetchPipelineData(); // Revert
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    const filteredOpportunitiesResult = (stageId: string) => {
        return opportunities.filter(
            (opp) =>
                opp.stage_id === stageId &&
                opp.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const handleStatusChange = async (oppId: string, targetSlug: string) => {
        const targetStage = stages.find(s => s.slug === targetSlug);
        if (!targetStage) return;

        // Optimistic remove if moving to hidden stage
        if (targetStage.position > 4) {
            setOpportunities(prev => prev.filter(o => o.id !== oppId));
        }

        try {
            await updateOpportunityStage(oppId, targetStage.id, type as string);
            // If not hidden, fetch to update UI fully? Or just trust optimistic?
            // If hidden (won/lost), we usually want it gone.
            if (targetStage.position <= 4) {
                fetchPipelineData();
            }
        } catch (err) {
            console.error(err);
            fetchPipelineData();
        }
    };

    if (!mounted) return null;

    const visibleStages = stages.filter(s => s.position <= 4);

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white capitalize">Pipeline {type === 'commercial' ? 'Comercial' : 'Entrega'}</h1>
                    <p className="text-slate-400 text-xs md:text-sm">
                        {type === 'commercial' ? 'Gerencie vendas e negociações.' : 'Acompanhe a produção e instalação.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-10 bg-slate-900 border-slate-800 text-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-500 text-white w-full sm:w-auto"
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
                stages={stages}
                onSuccess={fetchPipelineData}
            />

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-y-auto md:overflow-hidden pb-2 min-w-[300px] md:min-w-[1200px]">
                    {visibleStages.map((stage) => {
                        const stageOpps = filteredOpportunitiesResult(stage.id);
                        const totalValue = stageOpps.reduce((acc, curr) => acc + (curr.amount_final || curr.amount_estimated || 0), 0);

                        return (
                            <div key={stage.id} className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800/50 backdrop-blur-sm min-h-[300px] md:min-h-0">
                                <div className="p-3 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/60 rounded-t-xl sticky top-0 z-10">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${stage.position === 1 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                            stage.position === 2 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' :
                                                stage.position === 3 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                                                    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                            }`} />
                                        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-tight">{stage.name}</h3>
                                        <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[10px] h-5 px-1.5">
                                            {stageOpps.length}
                                        </Badge>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono">{formatCurrency(totalValue)}</span>
                                </div>

                                <Droppable droppableId={stage.id}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent space-y-2"
                                        >
                                            {stageOpps.map((opp, index) => (
                                                <Draggable key={opp.id} draggableId={opp.id} index={index}>
                                                    {(provided) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-slate-800 border-slate-700/50 hover:border-indigo-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                                                            onClick={() => router.push(`/opportunities/${opp.id}`)}
                                                        >
                                                            <CardContent className="p-3">
                                                                {/* Context Menu for Status - Visible on hover/touch */}
                                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-700 rounded-full" onClick={(e) => e.stopPropagation()}>
                                                                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                                                                            <DropdownMenuItem
                                                                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 cursor-pointer text-xs"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleStatusChange(opp.id, 'closed_won');
                                                                                }}
                                                                            >
                                                                                <CheckCircle2 className="w-3 h-3 mr-2" />
                                                                                Marcar como Ganho
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="text-red-400 hover:text-red-300 hover:bg-red-950/30 cursor-pointer text-xs"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleStatusChange(opp.id, 'closed_lost');
                                                                                }}
                                                                            >
                                                                                <XCircle className="w-3 h-3 mr-2" />
                                                                                Marcar como Perdido
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>

                                                                <div className="flex justify-between items-start gap-2 mb-2 pr-6">
                                                                    <h4 className="font-semibold text-slate-200 text-xs leading-snug group-hover:text-indigo-400 line-clamp-2">
                                                                        {opp.title}
                                                                    </h4>
                                                                    {opp.priority && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opp.priority === 'high' ? 'bg-red-500' : opp.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                                                                        }`} />}
                                                                </div>

                                                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                                    <span className="font-mono text-slate-300">
                                                                        {formatCurrency(opp.amount_final || opp.amount_estimated || 0)}
                                                                    </span>
                                                                    <span className="truncate max-w-[80px] flex items-center gap-1">
                                                                        {opp.proposal_sent_at && <FileText className="w-3 h-3 text-indigo-400" />}
                                                                        {opp.owner?.full_name?.split(' ')[0]}
                                                                    </span>
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
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
