'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const opportunitySchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    amount_estimated: z.coerce.number().min(0),
    priority: z.enum(['low', 'medium', 'high']),
    stage_id: z.string().min(1, 'Etapa é obrigatória'),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface NewOpportunityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pipelineSlug: string;
    stages: { id: string; name: string }[];
    onSuccess: () => void;
}

export function NewOpportunityModal({
    open,
    onOpenChange,
    pipelineSlug,
    stages,
    onSuccess,
}: NewOpportunityModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<OpportunityFormValues>({
        resolver: zodResolver(opportunitySchema),
        defaultValues: {
            title: '',
            amount_estimated: 0,
            priority: 'medium',
            stage_id: '',
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                title: '',
                amount_estimated: 0,
                priority: 'medium',
                stage_id: stages.length > 0 ? stages[0].id : '',
            });
        }
    }, [open, stages]);

    const onSubmit = async (values: OpportunityFormValues) => {
        setLoading(true);
        try {
            const { data: pipelineData } = await supabase
                .from('pipelines')
                .select('id')
                .eq('slug', pipelineSlug)
                .single();

            if (!pipelineData) throw new Error('Pipeline não encontrado');

            // Pegar ID do usuário logado
            const { data: { user } } = await supabase.auth.getUser();

            const tableName = pipelineSlug === 'delivery' ? 'delivery_opportunities' : 'opportunities';

            const insertPayload: any = {
                title: values.title,
                priority: values.priority,
                stage_id: values.stage_id,
                pipeline_id: pipelineData.id,
                owner_id: user?.id,
                status: 'active'
            };

            if (pipelineSlug === 'delivery') {
                insertPayload.amount_final = values.amount_estimated;
                // delivery_opportunities creates manually might not have commercial_opportunity_id
                // Ensure table allows NULL for it (it usually does or we updated schema)
            } else {
                insertPayload.amount_estimated = values.amount_estimated;
            }

            const { error } = await supabase
                .from(tableName as any)
                .insert(insertPayload);

            if (error) throw error;

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error creating opportunity:', error);
            alert(`Erro ao criar oportunidade: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Nova Oportunidade</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título / Cliente</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-950/50 border-slate-800" placeholder="Ex: Reforma Apartamento 402" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount_estimated"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Estimado</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="bg-slate-950/50 border-slate-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prioridade</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-slate-800">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                <SelectItem value="low">Baixa</SelectItem>
                                                <SelectItem value="medium">Média</SelectItem>
                                                <SelectItem value="high">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="stage_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Etapa Inicial</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={stages.length === 0}>
                                        <FormControl>
                                            <SelectTrigger className="bg-slate-950/50 border-slate-800">
                                                <SelectValue placeholder={stages.length === 0 ? "Nenhuma etapa disponível" : "Selecione a etapa"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            {stages.length === 0 ? (
                                                <div className="p-2 text-xs text-slate-500 text-center">
                                                    Configure as etapas no banco de dados.
                                                </div>
                                            ) : (
                                                stages.map((stage) => (
                                                    <SelectItem key={stage.id} value={stage.id}>
                                                        {stage.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Criar Oportunidade
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
