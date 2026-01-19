'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Lock, Mail, Loader2, User, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // MFA States
    const [showMfa, setShowMfa] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaFactorId, setMfaFactorId] = useState('');

    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (isLogin) {
            // Tenta o login básico (AAL1)
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            // Verifica se o usuário possui MFA configurado
            const { data: { user } } = await supabase.auth.getUser();
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const verifiedFactor = factors?.all.find(f => f.status === 'verified');

            if (verifiedFactor) {
                // Usuário tem 2FA ativo, precisa do desafio
                setMfaFactorId(verifiedFactor.id);
                setShowMfa(true);
                setLoading(false);
            } else {
                // Sem 2FA, entra direto
                router.push('/');
                router.refresh();
            }
        } else {
            // Fluxo de Cadastro
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    // Define explicitamente o redirecionamento se necessário
                    emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : ''
                },
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                alert('Cadastro realizado! Por favor, verifique seu e-mail.');
                setIsLogin(true);
                setLoading(false);
            }
        }
    };

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: mfaFactorId
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaFactorId,
                challengeId: challenge.id,
                code: mfaCode
            });

            if (verifyError) throw verifyError;

            // Sucesso no 2FA
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Código inválido');
            setLoading(false);
        }
    };

    if (showMfa) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-black p-4">
                <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl text-slate-100 shadow-2xl">
                    <CardHeader className="space-y-1 flex flex-col items-center">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="text-white w-7 h-7" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-white uppercase text-sm tracking-widest">Verificação 2FA</CardTitle>
                        <CardDescription className="text-slate-400 text-center">
                            Digite o código gerado pelo seu aplicativo de autenticação.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleVerifyMfa}>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="mfaCode" className="text-slate-300 text-center block">Código de Segurança</Label>
                                <Input
                                    id="mfaCode"
                                    type="text"
                                    placeholder="000 000"
                                    className="bg-slate-950/50 border-slate-800 text-slate-200 text-center text-2xl tracking-[0.5em] font-mono h-16"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                    required
                                    autoFocus
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-6 transition-all"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Verificar Código'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-slate-500 text-xs"
                                onClick={() => setShowMfa(false)}
                            >
                                Voltar para o login
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

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
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                        {isLogin ? 'Progetto CRM' : 'Criar Conta'}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-center">
                        {isLogin
                            ? 'Entre com suas credenciais para acessar a plataforma'
                            : 'Preencha os dados abaixo para se cadastrar'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-slate-300">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="Seu nome"
                                        className="pl-10 bg-slate-950/50 border-slate-800 text-slate-200"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
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
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-6 shadow-lg shadow-indigo-600/20 transition-all group"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                isLogin ? 'Entrar no Sistema' : 'Cadastrar'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            className="text-slate-400 hover:text-indigo-400"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Entre aqui'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
