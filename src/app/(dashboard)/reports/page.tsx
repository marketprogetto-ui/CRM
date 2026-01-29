'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import { formatCurrency } from '@/lib/utils-crm';
import {
    BarChart3,
    TrendingUp,
    Target,
    Users,
    PieChart as PieChartIcon,
    Flame,
    ArrowUpRight,
    Timer
} from 'lucide-react';

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);

        // Fetch opportunities with stages and profiles
        const { data: opps } = await supabase
            .from('opportunities')
            .select('*, stages(*), profiles(*)')
            .order('created_at', { ascending: false });

        if (!opps || opps.length === 0) {
            setData({
                forecastByStage: [],
                forecastByOwner: [],
                totalForecast: 0,
                activeDeals: 0,
                timelineData: []
            });
            setLoading(false);
            return;
        }

        // 1. Forecast by Stage
        const forecastByStage = {} as any;
        opps.forEach(o => {
            const stageName = o.stages?.name || 'Unknown';
            const value = (o.amount_final || o.amount_offered || o.amount_estimated || 0) * ((o.stages?.probability || 0) / 100);
            forecastByStage[stageName] = (forecastByStage[stageName] || 0) + value;
        });
        const forecastChart = Object.keys(forecastByStage).map(name => ({ name, value: forecastByStage[name] }));

        // 2. Forecast by Owner
        const forecastByOwner = {} as any;
        opps.forEach(o => {
            const ownerName = o.profiles?.full_name || 'Desconhecido';
            const value = (o.amount_final || o.amount_offered || o.amount_estimated || 0) * ((o.stages?.probability || 0) / 100);
            forecastByOwner[ownerName] = (forecastByOwner[ownerName] || 0) + value;
        });
        const ownerChart = Object.keys(forecastByOwner).map(name => ({ name, value: forecastByOwner[name] }));

        // 3. Timeline Data (Group by Week - Last 8 Weeks)
        const timelineMap = {} as any;
        const now = new Date();
        for (let i = 7; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - (i * 7));
            const weekLabel = `W${getWeekNumber(d)}`;
            timelineMap[weekLabel] = 0;
        }

        opps.forEach(o => {
            const d = new Date(o.created_at);
            if (d > new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)) {
                const weekLabel = `W${getWeekNumber(d)}`;
                if (timelineMap[weekLabel] !== undefined) {
                    timelineMap[weekLabel] += 1; // Count opportunities
                }
            }
        });
        const timelineData = Object.keys(timelineMap).map(name => ({ name, value: timelineMap[name] }));

        setData({
            forecastByStage: forecastChart,
            forecastByOwner: ownerChart,
            totalForecast: forecastChart.reduce((acc, curr) => acc + curr.value, 0),
            activeDeals: opps.length,
            timelineData
        });

        setLoading(false);
    };

    function getWeekNumber(d: Date) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return weekNo;
    }

    if (loading) return <div>Carregando Relatórios...</div>;

    const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316'];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Intelligence & Analytics</h1>
                <p className="text-slate-400 mt-1">Visão completa da performance comercial e entrega.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard
                    title="Forecast Total"
                    value={formatCurrency(data?.totalForecast || 0)}
                    icon={TrendingUp}
                    trend={data?.totalForecast > 0 ? "+0%" : "0%"}
                    color="indigo"
                />
                <StatsCard
                    title="Negócios Ativos"
                    value={data?.activeDeals || 0}
                    icon={Target}
                    trend={data?.activeDeals > 0 ? "+0" : "0"}
                    color="emerald"
                />
                <StatsCard
                    title="Ticket Médio"
                    value={formatCurrency(data?.activeDeals ? data.totalForecast / data.activeDeals : 0)}
                    icon={Flame}
                    trend="R$ 0.00"
                    color="orange"
                />
                <StatsCard
                    title="Ciclo Médio"
                    value="0 dias" // TODO: Implement real calculation
                    icon={Timer}
                    trend="0 dias"
                    color="violet"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            Forecast por Etapa
                        </CardTitle>
                        <CardDescription className="text-slate-500">Valor ponderado pela probabilidade de fechamento.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.forecastByStage || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#818cf8' }}
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            Performance por Consultor
                        </CardTitle>
                        <CardDescription className="text-slate-500">Distribuição do forecast entre os membros da equipe.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.forecastByOwner || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {data?.forecastByOwner?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-2 ml-4">
                            {data?.forecastByOwner?.map((entry: any, index: number) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-xs text-slate-400">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        Influxo de Oportunidades (8 Semanas)
                    </CardTitle>
                    <CardDescription className="text-slate-500">Volume de entrada de leads e negócios por semana.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.timelineData || []}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, trend, color }: any) {
    const colorMap = {
        indigo: 'from-indigo-600/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20',
        emerald: 'from-emerald-600/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
        orange: 'from-orange-600/20 to-orange-600/5 text-orange-400 border-orange-500/20',
        violet: 'from-violet-600/20 to-violet-600/5 text-violet-400 border-violet-500/20',
    } as any;

    return (
        <Card className={`bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative group`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-50`} />
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                    <Icon className={`w-6 h-6 ${colorMap[color].split(' ')[2]}`} />
                    <span className="text-[10px] font-black bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-slate-700 transition-colors">
                        {trend} <ArrowUpRight className="w-2.5 h-2.5" />
                    </span>
                </div>
                <div className="mt-4">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{title}</p>
                    <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );
}
