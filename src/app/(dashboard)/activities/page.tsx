'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Calendar,
    Clock,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Inbox
} from 'lucide-react';
import { formatDate } from '@/lib/utils-crm';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function GlobalActivitiesPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchGlobalActivities();
    }, []);

    const fetchGlobalActivities = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('activities')
            .select('*, opportunities(title)')
            .order('due_at', { ascending: true });
        setActivities(data || []);
        setLoading(false);
    };

    const pending = activities.filter(a => !a.done_at);
    const completed = activities.filter(a => !!a.done_at);
    const overdue = pending.filter(a => new Date(a.due_at) < new Date());

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Todas as Atividades</h1>
                    <p className="text-slate-400 text-sm">Acompanhe seus compromissos e tarefas em aberto.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-xs font-bold uppercase">Pendentes</span>
                            <Clock className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-black text-white">{pending.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 border-l-red-500/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <span className="text-red-400 text-xs font-bold uppercase">Atrasadas</span>
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-black text-red-400">{overdue.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 border-l-green-500/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <span className="text-green-400 text-xs font-bold uppercase">Concluídas</span>
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-black text-white">{completed.length}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-slate-800 text-xs">Pendentes ({pending.length})</TabsTrigger>
                    <TabsTrigger value="completed" className="data-[state=active]:bg-slate-800 text-xs">Concluídas ({completed.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {pending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 border-dashed">
                            <Inbox className="w-12 h-12 text-slate-700 mb-4" />
                            <p className="text-slate-500 italic">Nenhuma atividade pendente. Você está em dia!</p>
                        </div>
                    ) : (
                        pending.map(a => (
                            <ActivityCard key={a.id} activity={a} onNavigate={(id) => router.push(`/opportunities/${id}`)} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {completed.map(a => (
                        <ActivityCard key={a.id} activity={a} onNavigate={(id) => router.push(`/opportunities/${id}`)} />
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ActivityCard({ activity, onNavigate }: { activity: any, onNavigate: (id: string) => void }) {
    const isOverdue = new Date(activity.due_at) < new Date() && !activity.done_at;

    return (
        <Card className={`bg-slate-900 border-slate-800 hover:border-slate-700 transition-all ${activity.done_at ? 'opacity-60' : ''}`}>
            <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-2xl ${isOverdue ? 'bg-red-900/20 text-red-400' : 'bg-indigo-900/20 text-indigo-400'}`}>
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-slate-100 font-bold">{activity.title}</h4>
                        <p className="text-slate-500 text-xs mt-0.5">Oportunidade: <span className="text-slate-300 font-medium">{activity.opportunities?.title}</span></p>
                        <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-[10px] font-black uppercase text-slate-500 border-slate-800">
                                {activity.type}
                            </Badge>
                            <span className={`text-xs font-semibold ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                                {formatDate(activity.due_at)}
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(activity.opportunity_id)}
                    className="text-indigo-400 hover:bg-indigo-600/10 gap-2"
                >
                    Ver Detalhes <ExternalLink className="w-3.5 h-3.5" />
                </Button>
            </CardContent>
        </Card>
    );
}
