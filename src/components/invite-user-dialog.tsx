'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { inviteUser } from '@/actions/user-actions';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';

export function InviteUserDialog() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    // const { toast } = useToast(); // Assuming toaster exists, or simpler alert

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        const result = await inviteUser(email);

        if (result.error) {
            alert(`Erro: ${result.error}`);
        } else {
            setSuccess(true);
            setEmail('');
            setTimeout(() => setOpen(false), 2000);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white">
                    <Mail className="w-4 h-4" />
                    Convidar Usuário
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle>Convidar Novo Usuário</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Envie um convite por e-mail para que um novo membro possa criar sua senha e acessar o CRM.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-6 flex flex-col items-center justify-center text-emerald-500 animate-in fade-in zoom-in">
                        <CheckCircle className="w-12 h-12 mb-2" />
                        <p className="font-semibold">Convite enviado com sucesso!</p>
                    </div>
                ) : (
                    <form onSubmit={handleInvite} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">E-mail do Usuário</label>
                            <Input
                                type="email"
                                placeholder="usuario@empresa.com"
                                className="bg-slate-950 border-slate-700 text-slate-200"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Enviar Convite'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
