'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Plus,
    Download,
    CheckCircle2,
    Clock,
    ChevronRight,
    TrendingUp,
    DollarSign,
    FileSearch
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils-crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

export default function ProposalsList({ opportunityId }: { opportunityId: string }) {
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchProposals();
    }, [opportunityId]);

    const fetchProposals = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('proposals')
            .select('*, proposal_items(*, products(*))')
            .eq('opportunity_id', opportunityId)
            .order('version', { ascending: false });
        setProposals(data || []);
        setLoading(false);
    };

    const handleCreateProposal = async () => {
        // Get latest version
        const latestVersion = proposals.length > 0 ? proposals[0].version : 0;
        const newVersion = latestVersion + 1;

        const { data: proposal, error: proposalError } = await supabase
            .from('proposals')
            .insert([{
                opportunity_id: opportunityId,
                version: newVersion,
                total_amount: 0,
                status: 'draft'
            }])
            .select()
            .single();

        if (!proposalError) {
            setOpen(false);
            fetchProposals();
            // In a real app, you'd open the proposal editor here
            alert(`Versão ${newVersion} criada com sucesso!`);
        } else {
            alert(`Erro: ${proposalError.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        Orçamentos e Propostas
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">Gerencie as versões enviadas ao cliente.</p>
                </div>
                <Button onClick={handleCreateProposal} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 h-9 shadow-lg shadow-indigo-600/20">
                    <Plus className="w-4 h-4" /> Gerar Nova Versão
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {proposals.length === 0 && !loading && (
                    <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 border-dashed">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                            <FileSearch className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium italic">Nenhuma proposta gerada para esta oportunidade.</p>
                    </div>
                )}

                {proposals.map((proposal) => (
                    <Card key={proposal.id} className="bg-slate-900 border-slate-800 hover:border-indigo-500/50 transition-all group overflow-hidden shadow-xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-indigo-600 transition-colors" />
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Rev</span>
                                    <span className="text-xl font-black text-white leading-none">{String(proposal.version).padStart(2, '0')}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-bold text-slate-100">Proposta V{proposal.version}</h4>
                                        <Badge className={`${getStatusColor(proposal.status)} border text-[10px] font-black uppercase tracking-widest`}>
                                            {proposal.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <DollarSign className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-slate-300 font-semibold">{formatCurrency(proposal.total_amount)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Gerada em {formatDate(proposal.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2">
                                    <Download className="w-4 h-4" /> PDF
                                </Button>
                                <Button className="bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700">
                                    Detalhes <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
