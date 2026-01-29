'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, AlertCircle, Clock, ExternalLink, Inbox } from 'lucide-react';
import { formatDate } from '@/lib/utils-crm';
import { useRouter } from 'next/navigation';

export default function PipelineActivitiesList({ pipelineSlug }: { pipelineSlug: 'commercial' | 'delivery' }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchActivities();
    }, [pipelineSlug]);

    const fetchActivities = async () => {
        setLoading(true);

        let query = supabase
            .from('activities')
            .select(`
                *,
                profiles(full_name)
            `)
            .order('due_at', { ascending: true });

        if (pipelineSlug === 'commercial') {
            // Filter by commercial opportunities
            // Since filtering by joined table property needs !inner, we do:
            const { data, error } = await supabase
                .from('activities')
                .select(`
                    *,
                    opportunities!inner(
                        id,
                        title,
                        pipelines!inner(slug)
                    ),
                    profiles(full_name)
                `)
                .eq('opportunities.pipelines.slug', 'commercial')
                .order('due_at', { ascending: true });

            if (!error) setActivities(data || []);
            else console.error(error);

        } else {
            // Delivery
            // We look for activities linked to delivery_opportunities
            const { data, error } = await supabase
                .from('activities')
                .select(`
                    *,
                    delivery_opportunities!inner(
                        id,
                        title,
                        pipelines!inner(slug)
                    ),
                    profiles(full_name)
                `)
                .eq('delivery_opportunities.pipelines.slug', 'delivery')
                .order('due_at', { ascending: true });

            if (!error) setActivities(data || []);
            else console.error(error);
        }

        setLoading(false);
    };

    const pending = activities.filter(a => !a.done_at);
    // const completed = activities.filter(a => !!a.done_at);

    if (loading) return <div className="p-10 text-center text-slate-500">Carregando atividades...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.length === 0 ? (
                <div className="col-span-full py-10 flex flex-col items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed">
                    <Inbox className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-slate-500 text-sm">Nenhuma atividade pendente para {pipelineSlug === 'commercial' ? 'Comercial' : 'Entrega'}.</p>
                </div>
            ) : (
                pending.map(activity => {
                    const isOverdue = new Date(activity.due_at) < new Date();
                    const title = activity.opportunities?.title || activity.delivery_opportunities?.title || 'Sem título';
                    const oppId = activity.opportunities?.id || activity.delivery_opportunities?.id;

                    return (
                        <Card key={activity.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="text-[10px] font-black uppercase text-slate-500 border-slate-800">
                                        {activity.type}
                                    </Badge>
                                    <span className={`text-[10px] font-bold ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                                        {formatDate(activity.due_at)}
                                    </span>
                                </div>
                                <h4 className="text-slate-200 font-bold text-sm mb-1 line-clamp-1">{activity.title}</h4>
                                <p className="text-slate-500 text-xs mb-3 line-clamp-1">
                                    Ref: <span className="text-slate-400">{title}</span>
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                            {activity.profiles?.full_name?.[0] || 'U'}
                                        </div>
                                        <span className="truncate max-w-[80px]">{activity.profiles?.full_name?.split(' ')[0]}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] bg-slate-800 hover:bg-indigo-600 hover:text-white"
                                        onClick={() => router.push(`/opportunities/${oppId}`)}
                                    >
                                        Detalhes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
    );
}
