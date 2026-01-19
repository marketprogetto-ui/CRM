'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldAlert, User, Mail, Smartphone, QrCode } from 'lucide-react';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [fullName, setFullName] = useState('');
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mfaEnrollData, setMfaEnrollData] = useState<any>(null);
    const [mfaCode, setMfaCode] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profileData);
            setFullName(profileData?.full_name || '');

            const { data: factors } = await supabase.auth.mfa.listFactors();
            if (factors && factors.all.length > 0) {
                setMfaEnabled(factors.all.some(f => f.status === 'verified'));
            }
        }
        setLoading(false);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (error) {
            alert(`Erro ao salvar: ${error.message}`);
        } else {
            alert('Perfil atualizado com sucesso!');
        }
        setSaving(false);
    };

    const handleSetup2FA = async () => {
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            issuer: 'Progetto CRM',
            friendlyName: user?.email || 'User'
        });

        if (error) {
            alert(error.message);
        } else {
            setMfaEnrollData(data);
        }
    };

    const handleVerify2FA = async () => {
        if (!mfaEnrollData) return;

        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaEnrollData.id });
        if (challengeError) {
            alert(challengeError.message);
            return;
        }

        const { error: verifyError } = await supabase.auth.mfa.verify({
            factorId: mfaEnrollData.id,
            challengeId: challenge.id,
            code: mfaCode
        });

        if (verifyError) {
            alert(verifyError.message);
        } else {
            alert('2FA Ativado com sucesso!');
            setMfaEnabled(true);
            setMfaEnrollData(null);
            fetchProfile();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Configurações de Perfil</h1>
                    <p className="text-slate-400 text-sm">Gerencie suas informações e segurança da conta.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Lado Esquerdo: Info Básica */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
                        <CardHeader>
                            <CardTitle>Dados Pessoais</CardTitle>
                            <CardDescription className="text-slate-400">Suas informações visíveis na plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-slate-300">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="fullName"
                                        className="pl-10 bg-slate-950/50 border-slate-800"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        className="pl-10 bg-slate-800 border-slate-700 text-slate-400"
                                        value={user?.email || ''}
                                        disabled
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 italic">O e-mail não pode ser alterado diretamente.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-slate-800 pt-6">
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-500 min-w-[120px]"
                                onClick={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Salvar Alterações'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Lado Direito: Segurança e 2FA */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-medium">Autenticação 2FA</span>
                                    </div>
                                    <Badge className={mfaEnabled ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}>
                                        {mfaEnabled ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Adicione uma camada extra de segurança usando um aplicativo de autenticação (TOTP).
                                </p>

                                {!mfaEnabled && !mfaEnrollData && (
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-800 hover:bg-slate-800"
                                        onClick={handleSetup2FA}
                                    >
                                        Configurar 2FA
                                    </Button>
                                )}

                                {mfaEnrollData && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex justify-center bg-white p-2 rounded-lg">
                                            <img src={mfaEnrollData.totp.qr_code} alt="QR Code 2FA" className="w-32 h-32" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400">Código do App</Label>
                                            <Input
                                                value={mfaCode}
                                                onChange={(e) => setMfaCode(e.target.value)}
                                                placeholder="000000"
                                                className="bg-slate-950 border-slate-800 text-center tracking-widest font-mono"
                                            />
                                        </div>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-500" onClick={handleVerify2FA}>
                                            Verificar e Ativar
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-orange-400 flex-shrink-0" />
                                <div>
                                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Aviso</span>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Nunca compartilhe sua senha ou código 2FA com ninguém, inclusive com suporte da Progetto.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
