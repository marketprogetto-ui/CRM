'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    History,
    Search,
    Filter,
    Database,
    ArrowRight,
    Loader2,
    ShieldAlert
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils-crm';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        checkAdmin();
        fetchLogs();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            setIsAdmin(profile?.role === 'admin');
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, profiles:changed_by(full_name)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setLogs(data);
        setLoading(false);
    };

    if (!mounted) return null;

    if (!isAdmin && !loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
                <p className="text-slate-400 max-w-md">Apenas administradores podem visualizar os logs de auditoria do sistema.</p>
                <Button onClick={() => router.push('/')}>Voltar ao Início</Button>
            </div>
        );
    }

    const filteredLogs = logs.filter(log =>
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Auditoria</h1>
                    <p className="text-slate-400 text-sm">Registro histórico de alterações na base de dados.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar nos logs..."
                            className="pl-10 bg-slate-900 border-slate-800 text-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-400" />
                            Logs de Alteração
                        </CardTitle>
                        <CardDescription className="text-slate-500">Últimas 50 transações registradas automaticamente.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="border-slate-800">
                                <TableRow className="hover:bg-transparent border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                                    <TableHead className="min-w-[150px]">Data/Hora</TableHead>
                                    <TableHead>Tabela</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead className="min-w-[200px]">Resumo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                                            <p className="mt-2 text-slate-500 text-xs">Carregando rastros...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20 text-slate-500 italic text-xs">
                                            Nenhum registro de auditoria encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/30">
                                        <TableCell className="text-slate-300 text-[10px] font-mono whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] font-bold uppercase border-slate-800 bg-slate-950 text-slate-400">
                                                <Database className="w-3 h-3 mr-1" />
                                                <span className="truncate max-w-[80px]">{log.table_name}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-[9px] font-black uppercase tracking-tighter ${log.action === 'INSERT' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                                                log.action === 'UPDATE' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                                                    'bg-red-900/20 text-red-400 border-red-900/50'
                                                } border`}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-300 font-medium text-xs whitespace-nowrap">
                                            {log.profiles?.full_name?.split(' ')[0] || 'Sistema'}
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate text-[10px] text-slate-500">
                                            {log.action === 'INSERT' && 'Novo registro criado'}
                                            {log.action === 'UPDATE' && 'Valores modificados'}
                                            {log.action === 'DELETE' && 'Registro removido'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
