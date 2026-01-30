'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    ExternalLink,
    Plus,
    Calendar,
    CheckCircle2,
    FileText,
    ClipboardCheck,
    Truck,
    MessageSquare,
    Package,
    History,
    ChevronDown,
    Pencil,
    Trash2,
    Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils-crm';
import BriefingForm from '@/components/crm/briefing-form';
import MeasurementForm from '@/components/crm/measurement-form';
import ActivitiesList from '@/components/crm/activities-list';
import ProposalsList from '@/components/crm/proposals-list';
import OpportunitySummary from '@/components/crm/opportunity-summary';
import { EditOpportunityModal } from '@/components/crm/edit-opportunity-modal';

export default function OpportunityDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [opportunity, setOpportunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchOpportunity();
        fetchUserRole();
    }, [id]);

    const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            setUserRole(profile?.role || 'user');
        }
    };

    const fetchOpportunity = async () => {
        setLoading(true);

        // 1. Try Commercial Opportunity
        let { data, error } = await supabase
            .from('opportunities')
            .select('*, pipelines(name, slug), stages(name, position, probability), profiles(full_name)')
            .eq('id', id)
            .single();

        // 2. If not found, Try Delivery Opportunity
        if (error || !data) {
            const { data: delData, error: delError } = await supabase
                .from('delivery_opportunities')
                .select('*, pipelines(name, slug), stages(name, position, probability), profiles(full_name)')
                .eq('id', id)
                .single();

            if (!delError && delData) {
                // Normalize Profiles relation if needed (assuming profiles(full_name) works via fix_delivery_relations.sql)
                data = delData;
                error = null;
            }
        }

        if (error) {
            console.error('Error fetching opportunity:', error);
        } else {
            setOpportunity(data);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Oportunidade excluída com sucesso.');
            router.push(`/pipeline/${opportunity.pipelines?.slug || 'commercial'}`);
        } catch (error: any) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    if (!mounted) return null;

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
    );

    if (!opportunity) return <div className="text-white text-center p-20">Oportunidade não encontrada.</div>;

    const isCommercial = opportunity.pipelines?.slug === 'commercial';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center gap-2 md:gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white mt-1 md:mt-0 px-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h1 className="text-xl md:text-2xl font-bold text-white line-clamp-1">{opportunity.title}</h1>
                            <Badge className="bg-indigo-600/20 text-indigo-400 border-indigo-600/30 w-fit">
                                {opportunity.stages?.name}
                            </Badge>
                        </div>
                        <p className="text-slate-400 text-xs md:text-sm mt-1">
                            {opportunity.pipelines?.name} • {opportunity.profiles?.full_name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {opportunity.origin_opportunity_id && (
                        <Button
                            variant="outline"
                            className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs h-9"
                            onClick={() => router.push(`/opportunities/${opportunity.origin_opportunity_id}`)}
                        >
                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                            Ver {isCommercial ? 'Comercial' : 'Entrega'}
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 ml-auto md:ml-0 gap-2">
                                Ações <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white min-w-[160px]">
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-slate-800 gap-2"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <Pencil className="w-4 h-4 text-indigo-400" />
                                Alterar Dados
                            </DropdownMenuItem>

                            {userRole === 'admin' && (
                                <DropdownMenuItem
                                    className="cursor-pointer hover:bg-red-900/20 text-red-400 gap-2"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir Registro
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <EditOpportunityModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                opportunity={opportunity}
                onSuccess={fetchOpportunity}
            />

            <Tabs defaultValue="summary" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl w-full justify-start overflow-x-auto">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white gap-2">
                        <ClipboardCheck className="w-4 h-4" /> Resumo
                    </TabsTrigger>
                    <TabsTrigger value="briefing" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white gap-2">
                        <MessageSquare className="w-4 h-4" /> Briefing
                    </TabsTrigger>
                    <TabsTrigger value="measurement" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white gap-2">
                        <Truck className="w-4 h-4" /> Medição
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white gap-2">
                        <Calendar className="w-4 h-4" /> Atividades
                    </TabsTrigger>
                    {isCommercial && (
                        <TabsTrigger value="proposals" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white gap-2">
                            <FileText className="w-4 h-4" /> Propostas
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="history" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white gap-2">
                        <History className="w-4 h-4" /> Histórico
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="summary">
                        <OpportunitySummary opportunity={opportunity} />
                    </TabsContent>
                    <TabsContent value="briefing">
                        <BriefingForm opportunityId={opportunity.id} initialData={opportunity.briefing} />
                    </TabsContent>
                    <TabsContent value="measurement">
                        <MeasurementForm opportunityId={opportunity.id} initialData={opportunity.measurement_data} />
                    </TabsContent>
                    <TabsContent value="activities">
                        <ActivitiesList opportunityId={opportunity.id} />
                    </TabsContent>
                    {isCommercial && (
                        <TabsContent value="proposals">
                            <ProposalsList opportunityId={opportunity.id} />
                        </TabsContent>
                    )}
                    <TabsContent value="history">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg font-semibold">Histórico de Etapas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-slate-400">Em breve: Histórico detalhado de mudanças.</div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

