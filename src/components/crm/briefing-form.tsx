'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Save, FileText } from 'lucide-react';

const briefingSchema = z.object({
    project_type: z.string().min(1, 'Tipo de projeto é obrigatório'),
    rooms_count: z.coerce.number().min(0),
    openings_count: z.coerce.number().min(0),
    style_notes: z.string().optional(),
    priority_factors: z.array(z.string()).default([]),
    automation: z.object({
        required: z.boolean().default(false),
        type: z.string().nullable().default(null),
        brand_preference: z.string().nullable().default(null),
        power_point_available: z.boolean().default(false),
    }),
    budget_range: z.object({
        min: z.coerce.number().optional().default(0),
        max: z.coerce.number().optional().default(0),
    }),
    products: z.array(z.string()).default([]),
    constraints: z.string().optional(),
    notes: z.string().optional(),
});

type BriefingFormValues = z.infer<typeof briefingSchema>;

interface BriefingData {
    project_type?: string;
    rooms_count?: number;
    openings_count?: number;
    style_notes?: string;
    priority_factors?: string[];
    automation?: {
        required?: boolean;
        type?: string | null;
        brand_preference?: string | null;
        power_point_available?: boolean;
    };
    budget_range?: {
        min?: number;
        max?: number;
    };
    products?: string[];
    constraints?: string;
    notes?: string;
}

export default function BriefingForm({
    opportunityId,
    initialData
}: {
    opportunityId: string;
    initialData: BriefingData | null;
}) {
    const [loading, setLoading] = useState(false);

    // Sanitize initial data to match schema exactly using useMemo to avoid re-creation on render
    const sanitizedData: BriefingFormValues = useMemo(() => ({
        project_type: initialData?.project_type || '',
        rooms_count: Number(initialData?.rooms_count) || 0,
        openings_count: Number(initialData?.openings_count) || 0,
        style_notes: initialData?.style_notes || '',
        priority_factors: Array.isArray(initialData?.priority_factors) ? initialData.priority_factors : [],
        automation: {
            required: !!initialData?.automation?.required,
            type: initialData?.automation?.type || null,
            brand_preference: initialData?.automation?.brand_preference || null,
            power_point_available: !!initialData?.automation?.power_point_available,
        },
        budget_range: {
            min: Number(initialData?.budget_range?.min) || 0,
            max: Number(initialData?.budget_range?.max) || 0,
        },
        products: Array.isArray(initialData?.products) ? initialData.products : [],
        constraints: typeof initialData?.constraints === 'string' ? initialData.constraints : '',
        notes: initialData?.notes || '',
    }), [initialData]);

    const form = useForm<BriefingFormValues>({
        resolver: zodResolver(briefingSchema),
        defaultValues: sanitizedData,
    });

    // Reset form when sanitizedData changes
    useEffect(() => {
        if (initialData) {
            form.reset(sanitizedData);
        }
    }, [initialData, sanitizedData, form]);

    async function onSubmit(values: BriefingFormValues) {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('opportunities')
                .update({ briefing: values })
                .eq('id', opportunityId);

            if (error) throw error;
            alert('Briefing salvo com sucesso!');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            alert(`Erro ao salvar: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <CardContent className="p-6 space-y-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h3 className="text-white font-semibold">Definições do Projeto</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="project_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Tipo de Projeto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Residencial, Comercial" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rooms_count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Qtd. Ambientes</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="openings_count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Qtd. Janelas/Vãos</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="style_notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Notas de Estilo / Preferências</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Descreva as preferências estéticas do cliente..." {...field} className="bg-slate-950/50 border-slate-800 text-slate-200 min-h-[100px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 p-5 bg-slate-800/40 rounded-2xl border border-slate-800">
                                <FormLabel className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest">Automação</FormLabel>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="automation.required"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="text-slate-300">Requer Automação?</FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="automation.type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-slate-500">Tipo de Motor</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ''} className="bg-slate-950/50 border-slate-800 text-slate-200 h-8 text-xs" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="automation.brand_preference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-slate-500">Preferência Marca</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ''} className="bg-slate-950/50 border-slate-800 text-slate-200 h-8 text-xs" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 p-5 bg-slate-800/40 rounded-2xl border border-slate-800">
                                <FormLabel className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest">Restrições e Necessidades</FormLabel>
                                <FormField
                                    control={form.control}
                                    name="constraints"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Restrições / Observações Técnicas</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Ex: Necessita blackout total, crianças pequenas no local, teto de gesso frágil..."
                                                    className="bg-slate-950/50 border-slate-800 text-slate-200 min-h-[100px]"
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="budget_range.min"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Budget Mínimo (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="budget_range.max"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Budget Máximo (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Observações Adicionais</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Outras informações relevantes..." {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="bg-slate-900/50 border-t border-slate-800 flex justify-end p-6">
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-semibold min-w-[150px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Briefing
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
