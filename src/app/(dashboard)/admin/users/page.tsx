'use client';



import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    UserPlus,
    Shield,
    User as UserIcon,
    MoreHorizontal,
    Mail,
    Trash2,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';

export default function UsersManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        checkAdmin();
        fetchUsers();
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

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (data) setUsers(data);
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) fetchUsers();
    };

    const handleInviteUser = async () => {
        setInviting(true);
        // Em um cenário real com Supabase, o convite é feito via Auth Admin API
        // Aqui simulamos a entrega de um link ou instrução
        alert(`Link de convite gerado para: ${inviteEmail}\n\nNo Supabase Dashboard, use: Authentication > Users > Invite para enviar o e-mail oficial.`);
        setInviting(false);
        setInviteModalOpen(false);
        setInviteEmail('');
    };

    if (!mounted) return null;

    if (!isAdmin && !loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
                <p className="text-slate-400 max-w-md">Apenas administradores podem gerenciar usuários.</p>
                <Button onClick={() => router.push('/')}>Voltar ao Início</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Gestão de Usuários</h1>
                    <p className="text-slate-400 text-sm">Gerencie permissões e convide novos membros para a equipe.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-500 w-full sm:w-auto" onClick={() => setInviteModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convidar Usuário
                </Button>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg">Usuários Ativos</CardTitle>
                    <CardDescription className="text-slate-500">Lista de todos os perfis cadastrados no CRM.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="border-slate-800">
                                <TableRow className="hover:bg-transparent border-slate-800 text-slate-400">
                                    <TableHead className="min-w-[200px]">Usuário</TableHead>
                                    <TableHead className="min-w-[150px]">E-mail</TableHead>
                                    <TableHead>Cargo/Role</TableHead>
                                    <TableHead>Status 2FA</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : users.map((user) => (
                                    <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/30">
                                        <TableCell className="font-medium text-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700 font-bold">
                                                    {user.full_name?.substring(0, 1) || 'U'}
                                                </div>
                                                <span className="truncate">{user.full_name || 'Sem Nome'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-400">
                                            <div className="flex items-center gap-2 truncate">
                                                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="truncate">{user.email || 'vincular@mail.com'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={user.role === 'admin' ? "bg-indigo-900/30 text-indigo-400 border-indigo-500/30" : "bg-slate-800 text-slate-400"}>
                                                {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                                                {user.role === 'admin' ? 'Admin' : 'Colab'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={user.two_factor_enabled ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-slate-500 border-slate-800"}>
                                                {user.two_factor_enabled ? 'ON' : 'OFF'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                                    <DropdownMenuLabel>Alterar Permissão</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')} className="cursor-pointer hover:bg-slate-800">
                                                        Promover a Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')} className="cursor-pointer hover:bg-slate-800">
                                                        Rebaixar a Colaborador
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-800" />
                                                    <DropdownMenuItem className="text-red-400 cursor-pointer hover:bg-red-900/20">
                                                        <Trash2 className="w-4 h-4 mr-2" /> Excluir Conta
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Convite */}
            <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Convidar Novo Usuário</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Enviaremos um link para o e-mail informado para concluir o cadastro.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">E-mail do convidado</Label>
                            <Input
                                id="email"
                                placeholder="exemplo@empresa.com"
                                className="bg-slate-950 border-slate-800"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setInviteModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-500" onClick={handleInviteUser} disabled={inviting}>
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Enviar Convite'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
