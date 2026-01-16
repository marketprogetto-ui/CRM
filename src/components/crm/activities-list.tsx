'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Plus,
    Trash2,
    MoreVertical,
    Activity,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils-crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActivitiesList({ opportunityId }: { opportunityId: string }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newActivity, setNewActivity] = useState({
        title: '',
        type: 'call',
        due_at: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchActivities();
    }, [opportunityId]);

    const fetchActivities = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('activities')
            .select('*')
            .eq('opportunity_id', opportunityId)
            .order('due_at', { ascending: true });
        setActivities(data || []);
        setLoading(false);
    };

    const handleCreateActivity = async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { error } = await supabase
            .from('activities')
            .insert([{
                ...newActivity,
                opportunity_id: opportunityId,
                created_by: userData.user.id
            }]);

        if (!error) {
            setOpen(false);
            fetchActivities();
        }
    };

    const handleToggleDone = async (id: string, currentStatus: string | null) => {
        const done_at = currentStatus ? null : new Date().toISOString();
        const { error } = await supabase
            .from('activities')
            .update({ done_at })
            .eq('id', id);

        if (!error) fetchActivities();
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (!error) fetchActivities();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Atividades Agendadas
                </h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 h-9">
                            <Plus className="w-4 h-4" /> Nova Atividade
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>Agendar Nova Atividade</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Título / Descrição</Label>
                                <Input
                                    value={newActivity.title}
                                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                    placeholder="Ex: Ligar para confirmar orçamento"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        value={newActivity.type}
                                        onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}
                                    >
                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                            <SelectItem value="call">Chamada</SelectItem>
                                            <SelectItem value="meeting">Reunião</SelectItem>
                                            <SelectItem value="email">E-mail</SelectItem>
                                            <SelectItem value="site_visit">Visita</SelectItem>
                                            <SelectItem value="other">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Vencimento</Label>
                                    <Input
                                        type="date"
                                        value={newActivity.due_at}
                                        onChange={(e) => setNewActivity({ ...newActivity, due_at: e.target.value })}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-500" onClick={handleCreateActivity}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {activities.length === 0 && !loading && (
                    <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed">
                        <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500">Nenhuma atividade agendada.</p>
                    </div>
                )}

                {activities.map((activity) => {
                    const isOverdue = new Date(activity.due_at) < new Date() && !activity.done_at;
                    return (
                        <Card key={activity.id} className={`bg-slate-900 border-slate-800 group hover:border-slate-700 transition-all ${activity.done_at ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleDone(activity.id, activity.done_at)}
                                        className={`h-10 w-10 rounded-full p-0 flex items-center justify-center transition-all ${activity.done_at ? 'text-green-500 bg-green-500/10' : 'text-slate-500 border border-slate-700 hover:border-indigo-500 hover:text-indigo-400'}`}
                                    >
                                        {activity.done_at ? <CheckCircle className="w-6 h-6" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                    </Button>
                                    <div>
                                        <h4 className={`font-medium ${activity.done_at ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                            {activity.title}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold border-slate-800 bg-slate-800/40 text-slate-400">
                                                {activity.type}
                                            </Badge>
                                            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                                                <Clock className="w-3 h-3" />
                                                {formatDate(activity.due_at)}
                                                {isOverdue && <span className="ml-1 font-bold text-[10px] uppercase tracking-tighter flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Atrasada
                                                </span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(activity.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
