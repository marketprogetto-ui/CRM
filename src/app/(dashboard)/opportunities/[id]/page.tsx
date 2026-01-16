'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    History
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils-crm';
import BriefingForm from '@/components/crm/briefing-form';
import MeasurementForm from '@/components/crm/measurement-form';
import ActivitiesList from '@/components/crm/activities-list';
import ProposalsList from '@/components/crm/proposals-list';
import OpportunitySummary from '@/components/crm/opportunity-summary';

export default function OpportunityDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [opportunity, setOpportunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOpportunity();
    }, [id]);

    const fetchOpportunity = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('opportunities')
            .select('*, pipelines(name, slug), stages(name, position, probability), profiles(full_name)')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching opportunity:', error);
        } else {
            setOpportunity(data);
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!opportunity) return <div>Oportunidade não encontrada.</div>;

    const isCommercial = opportunity.pipelines?.slug === 'commercial';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{opportunity.title}</h1>
                            <Badge className="bg-indigo-600/20 text-indigo-400 border-indigo-600/30">
                                {opportunity.stages?.name}
                            </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                            Pipeline: {opportunity.pipelines?.name} • Responsável: {opportunity.profiles?.full_name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {opportunity.origin_opportunity_id && (
                        <Button
                            variant="outline"
                            className="border-slate-800 text-slate-300 hover:bg-slate-800"
                            onClick={() => router.push(`/opportunities/${opportunity.origin_opportunity_id}`)}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver {isCommercial ? 'Comercial' : 'Entrega'}
                        </Button>
                    )}
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                        Ações
                    </Button>
                </div>
            </div>

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
