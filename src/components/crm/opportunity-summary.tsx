'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils-crm';
import { DollarSign, User, Calendar, MapPin, Tag, TrendingUp, Info } from 'lucide-react';

export default function OpportunitySummary({ opportunity }: { opportunity: any }) {
    const forecast = (opportunity.amount_final || opportunity.amount_offered || opportunity.amount_estimated || 0) * (opportunity.stages?.probability / 100);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                    <div className="h-1 bg-indigo-600" />
                    <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-400" />
                            Detalhes Gerais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Valor Estimado</label>
                                <div className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-500" />
                                    {formatCurrency(opportunity.amount_estimated || 0)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Valor Ofertado</label>
                                <div className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-blue-500" />
                                    {formatCurrency(opportunity.amount_offered || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Descrição / Observações</label>
                            <p className="text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 leading-relaxed">
                                {opportunity.description || 'Nenhuma descrição fornecida.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Criado em</p>
                                    <p className="text-sm text-slate-200">{formatDate(opportunity.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                                <TrendingUp className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Probabilidade</p>
                                    <p className="text-sm text-slate-200">{opportunity.stages?.probability}%</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            Forecast
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center p-6 bg-indigo-600/10 rounded-2xl border border-indigo-600/20">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-2">Valor Esperado</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(forecast)}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-400" />
                            Responsável
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl font-bold text-indigo-400 border border-slate-700">
                            {opportunity.profiles?.full_name?.substring(0, 1) || 'U'}
                        </div>
                        <div>
                            <p className="text-white font-semibold">{opportunity.profiles?.full_name || 'Sem responsável'}</p>
                            <p className="text-slate-500 text-xs font-medium uppercase mt-0.5">Account Owner</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
