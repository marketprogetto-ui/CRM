'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Save, Ruler, User, Hammer } from 'lucide-react';

const measurementSchema = z.object({
    visit: z.object({
        measurer_name: z.string().min(1, 'Nome do medidor é obrigatório'),
        visited_at: z.string().min(1, 'Data da visita é obrigatória'),
    }),
    technical: z.object({
        mount_type_default: z.string().min(1, 'Tipo de fixação é obrigatório'),
        ceiling_type: z.string().min(1, 'Tipo de teto é obrigatório'),
        has_obstacles: z.boolean().default(false),
        obstacles_notes: z.string().optional(),
        power_point_available: z.boolean().default(false),
    }),
    openings: z.array(z.object({
        room: z.string().min(1, 'Ambiente é obrigatório'),
        opening_label: z.string().min(1, 'Etiqueta é obrigatória'),
        width_mm: z.coerce.number().min(0, 'Largura inválida'),
        height_mm: z.coerce.number().min(0, 'Altura inválida'),
        mount_type: z.string().min(1, 'Fixação é obrigatória'),
        product_suggestion: z.string().optional(),
        blackout: z.boolean().default(false),
        photo_refs: z.array(z.string()).default([]),
        notes: z.string().optional(),
    })).default([]),
    summary: z.object({
        total_openings: z.coerce.number().default(0),
        complexity_level: z.string().default('low'),
        general_notes: z.string().optional(),
    }),
});

type MeasurementFormValues = z.infer<typeof measurementSchema>;

interface MeasurementData {
    visit?: {
        measurer_name?: string;
        visited_at?: string;
    };
    technical?: {
        mount_type_default?: string;
        ceiling_type?: string;
        has_obstacles?: boolean;
        obstacles_notes?: string;
        power_point_available?: boolean;
    };
    openings?: Array<{
        room?: string;
        opening_label?: string;
        width_mm?: number;
        height_mm?: number;
        mount_type?: string;
        product_suggestion?: string;
        blackout?: boolean;
        photo_refs?: string[];
        notes?: string;
    }>;
    summary?: {
        total_openings?: number;
        complexity_level?: string;
        general_notes?: string;
    };
}

export default function MeasurementForm({
    opportunityId,
    initialData
}: {
    opportunityId: string;
    initialData: MeasurementData | null;
}) {
    const [loading, setLoading] = useState(false);

    // Sanitize initial data
    const sanitizedData: DefaultValues<MeasurementFormValues> = useMemo(() => {
        return {
            visit: {
                measurer_name: initialData?.visit?.measurer_name || '',
                visited_at: initialData?.visit?.visited_at || new Date().toISOString().split('T')[0],
            },
            technical: {
                mount_type_default: initialData?.technical?.mount_type_default || '',
                ceiling_type: initialData?.technical?.ceiling_type || '',
                has_obstacles: !!initialData?.technical?.has_obstacles,
                obstacles_notes: initialData?.technical?.obstacles_notes || '',
                power_point_available: !!initialData?.technical?.power_point_available,
            },
            openings: Array.isArray(initialData?.openings) ? initialData.openings.map((o) => ({
                room: o.room || '',
                opening_label: o.opening_label || '',
                width_mm: Number(o.width_mm) || 0,
                height_mm: Number(o.height_mm) || 0,
                mount_type: o.mount_type || '',
                product_suggestion: o.product_suggestion || '',
                blackout: !!o.blackout,
                photo_refs: Array.isArray(o.photo_refs) ? o.photo_refs : [],
                notes: o.notes || '',
            })) : [],
            summary: {
                total_openings: Number(initialData?.summary?.total_openings) || 0,
                complexity_level: initialData?.summary?.complexity_level || 'low',
                general_notes: initialData?.summary?.general_notes || '',
            }
        };
    }, [initialData]);

    const form = useForm<MeasurementFormValues>({
        resolver: zodResolver(measurementSchema) as any,
        defaultValues: sanitizedData,
    });

    useEffect(() => {
        if (initialData) {
            form.reset(sanitizedData);
        }
    }, [initialData, sanitizedData, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "openings"
    });

    async function onSubmit(values: MeasurementFormValues) {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('opportunities')
                .update({ measurement_data: values })
                .eq('id', opportunityId);

            if (error) throw error;
            alert('Dados de medição salvos com sucesso!');
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
                    <CardHeader className="border-b border-slate-800 pb-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
                                <Ruler className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <CardTitle className="text-white text-xl">Ficha de Medição Técnica</CardTitle>
                                <p className="text-slate-500 text-sm">Levantamento preciso para fabricação e instalação.</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 p-5 bg-slate-800/20 rounded-2xl border border-slate-800/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-orange-400" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Dados da Visita</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="visit.measurer_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-400 text-xs text-slate-300">Medidor</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200 h-9" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="visit.visited_at"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-400 text-xs text-slate-300">Data da Visita</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200 h-9" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-5 bg-slate-800/20 rounded-2xl border border-slate-800/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Hammer className="w-4 h-4 text-orange-400" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Perfil Técnico</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="technical.mount_type_default"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-400 text-xs text-slate-300">Instalação Padrão</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Teto/Parede" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200 h-9" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="technical.ceiling_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-400 text-xs text-slate-300">Tipo de Teto</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Gesso/Laje" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200 h-9" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-orange-400" />
                                    Detalhamento de Vãos
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({
                                        room: '',
                                        opening_label: '',
                                        width_mm: 0,
                                        height_mm: 0,
                                        mount_type: form.getValues('technical.mount_type_default') || '',
                                        product_suggestion: '',
                                        blackout: false,
                                        notes: '',
                                        photo_refs: []
                                    })}
                                    className="border-slate-800 text-slate-300 hover:bg-slate-800 h-8"
                                >
                                    Adicionar Vão
                                </Button>
                            </div>

                            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                                <Table>
                                    <TableHeader className="bg-slate-900 border-b border-slate-800">
                                        <TableRow className="border-none hover:bg-transparent">
                                            <TableHead className="text-slate-400 text-[10px] uppercase font-black">Ambiente</TableHead>
                                            <TableHead className="text-slate-400 text-[10px] uppercase font-black">Identificação</TableHead>
                                            <TableHead className="text-slate-400 text-[10px] uppercase font-black w-24">Larg. (mm)</TableHead>
                                            <TableHead className="text-slate-400 text-[10px] uppercase font-black w-24">Alt. (mm)</TableHead>
                                            <TableHead className="text-slate-400 text-[10px] uppercase font-black">Fixação</TableHead>
                                            <TableHead className="text-slate-400 text-[10px] uppercase font-black">Sugestão</TableHead>
                                            <TableHead className="text-slate-400 text-[10px] uppercase font-black w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => (
                                            <TableRow key={field.id} className="border-slate-800 hover:bg-slate-900/30">
                                                <TableCell className="p-2">
                                                    <Input {...form.register(`openings.${index}.room`)} className="h-8 text-xs bg-slate-900/50 border-slate-800 text-slate-200" />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input {...form.register(`openings.${index}.opening_label`)} className="h-8 text-xs bg-slate-900/50 border-slate-800 text-slate-200" />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input type="number" {...form.register(`openings.${index}.width_mm`)} className="h-8 text-xs bg-slate-900/50 border-slate-800 text-slate-200" />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input type="number" {...form.register(`openings.${index}.height_mm`)} className="h-8 text-xs bg-slate-900/50 border-slate-800 text-slate-200" />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input {...form.register(`openings.${index}.mount_type`)} className="h-8 text-xs bg-slate-900/50 border-slate-800 text-slate-200" />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input {...form.register(`openings.${index}.product_suggestion`)} className="h-8 text-xs bg-slate-900/50 border-slate-800 text-slate-200" />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                        className="text-slate-500 hover:text-red-400 h-8 w-8 p-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {fields.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-10 text-slate-600 text-sm">
                                                    Nenhum vão cadastrado.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="technical.obstacles_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Notas sobre Obstáculos</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Puxadores, roldanas, fiação, etc..." {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="space-y-4 pt-8">
                                <FormField
                                    control={form.control}
                                    name="technical.has_obstacles"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel className="text-slate-300 text-sm">Possui Obstáculos Relevantes</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="technical.power_point_available"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel className="text-slate-300 text-sm">Ponto Elétrico Disponível</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-semibold">Resumo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="summary.total_openings"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Total de Vãos</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="summary.complexity_level"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Nível de Complexidade</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="w-full bg-slate-950/50 border-slate-800 text-slate-200 rounded-md h-9 px-3 text-sm"
                                                >
                                                    <option value="low">Baixa</option>
                                                    <option value="medium">Média</option>
                                                    <option value="high">Alta</option>
                                                </select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="summary.general_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Observações Gerais</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Outras informações..." {...field} className="bg-slate-950/50 border-slate-800 text-slate-200" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-900/50 border-t border-slate-800 flex justify-end p-6">
                        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-500 text-white gap-2 font-semibold min-w-[150px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Medição
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
