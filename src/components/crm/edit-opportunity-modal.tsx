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
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface EditOpportunityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    opportunity: any;
    onSuccess: () => void;
}

export function EditOpportunityModal({
    open,
    onOpenChange,
    opportunity,
    onSuccess,
}: EditOpportunityModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<OpportunityFormValues>({
        resolver: zodResolver(opportunitySchema),
        defaultValues: {
            title: '',
            amount_estimated: 0,
            priority: 'medium',
        },
    });

    useEffect(() => {
        if (open && opportunity) {
            form.reset({
                title: opportunity.title,
                amount_estimated: opportunity.amount_estimated || 0,
                priority: opportunity.priority || 'medium',
            });
        }
    }, [open, opportunity, form]);

    const onSubmit = async (values: OpportunityFormValues) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('opportunities')
                .update({
                    ...values,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', opportunity.id);

            if (error) throw error;

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error updating opportunity:', error);
            alert(`Erro ao atualizar oportunidade: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Alterar Oportunidade</DialogTitle>
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
                                        <Input {...field} className="bg-slate-950/50 border-slate-800" />
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
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
