'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-black p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
            </div>

            <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl text-slate-100 shadow-2xl relative z-10">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                        <Building2 className="text-white w-7 h-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Progetto CRM</CardTitle>
                    <CardDescription className="text-slate-400">
                        Entre com suas credenciais para acessar a plataforma
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="pl-10 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" title="Senha" className="text-slate-300">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-6 shadow-lg shadow-indigo-600/20 transition-all group"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                'Entrar no Sistema'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
