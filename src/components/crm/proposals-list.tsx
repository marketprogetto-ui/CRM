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
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('opportunity_id', opportunityId)
            .order('version', { ascending: false });

        if (error) {
            console.error('Error fetching proposals:', error);
        }

        setProposals(data || []);
        setLoading(false);
    };

    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | DragEvent) => {
        let file: File | null = null;
        if ('dataTransfer' in e) {
            file = e.dataTransfer?.files?.[0] || null;
        } else {
            file = e.target.files?.[0] || null;
        }

        if (!file) return;

        try {
            setUploading(true);
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${opportunityId}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('proposals')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public Link (or Signed URL if private)
            const { data: { publicUrl } } = supabase.storage
                .from('proposals')
                .getPublicUrl(filePath);

            // Create Proposal Record
            const latestVersion = proposals.length > 0 ? proposals[0].version : 0;
            const newVersion = latestVersion + 1;

            const { error: dbError } = await supabase.from('proposals').insert({
                opportunity_id: opportunityId,
                version: newVersion,
                total_amount: 0, // Should be updated later or extracted
                status: 'draft',
                file_path: filePath,
                file_name: file.name,
                proposal_link: publicUrl
            });

            if (dbError) throw dbError;

            alert('Proposta enviada (upload) com sucesso!');
            fetchProposals();
        } catch (error: any) {
            console.error('Upload Error:', error);
            alert(`Erro no upload: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSendProposal = async (proposalId: string) => {
        const { error } = await supabase.rpc('send_proposal', { proposal_id: proposalId });
        // OR direct update if RPC doesn't exist. User asked to "set proposal_sent_at = now()".

        // Update Proposal status and sent_at
        await supabase
            .from('proposals')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', proposalId);

        // Update Opportunity proposal_sent_at
        await supabase
            .from('opportunities')
            .update({ proposal_sent_at: new Date().toISOString() })
            .eq('id', opportunityId);

        fetchProposals();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        Orçamentos e Propostas
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">Gerencie arquivos e versões.</p>
                </div>
                <div className="relative">
                    <input
                        type="file"
                        id="upload-proposal"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="upload-proposal"
                        className={`cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white gap-2 h-9 px-4 rounded-md inline-flex items-center text-sm font-medium transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {uploading ? 'Enviando...' : 'Carregar Nova Proposta'}
                    </label>
                </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e as unknown as any); // Cast for simplicity in this snippet
                }}
                className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FileText className="w-8 h-8 opacity-50" />
                    <span className="text-sm">Arraste seu arquivo PDF/DOC aqui ou clique no botão acima</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {proposals.map((proposal) => (
                    <Card key={proposal.id} className="bg-slate-900 border-slate-800 hover:border-indigo-500/50 transition-all">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 text-white font-bold text-lg">
                                    V{proposal.version}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-slate-100">{proposal.file_name || `Proposta V${proposal.version}`}</h4>
                                        <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                        <span>{formatDate(proposal.created_at)}</span>
                                        {proposal.sent_at && <span className="text-green-500">Enviado em: {formatDate(proposal.sent_at)}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {proposal.proposal_link && (
                                    <Button variant="outline" size="sm" asChild className="border-slate-700 text-slate-300">
                                        <a href={proposal.proposal_link} target="_blank" rel="noopener noreferrer">
                                            <Download className="w-4 h-4 mr-2" /> Baixar
                                        </a>
                                    </Button>
                                )}
                                {proposal.status !== 'sent' && (
                                    <Button size="sm" onClick={() => handleSendProposal(proposal.id)} className="bg-indigo-600 hover:bg-indigo-500">
                                        Enviar Proposta
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
