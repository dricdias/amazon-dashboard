'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, Activity } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
    palavra_chave: z.string().min(1, 'Palavra-chave é obrigatória'),
    pagina_inicial: z.number().min(1, 'Página inicial deve ser no mínimo 1'),
    tag_amazon: z.string().min(1, 'Tag Amazon é obrigatória'),
    cookies_amazon: z.string().min(10, 'Insira os cookies válidos da Amazon'),
    instancia_whatsapp: z.string().min(1, 'Instância do WhatsApp é obrigatória'),
    minutos_verificacao: z.number().min(1, 'Tempo mínimo de 1 minuto'),
});

type FormValues = z.infer<typeof formSchema>;

export function DashboardForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/status-automation');
                const data = await res.json();
                if (res.ok && data.success) {
                    setIsRunning(data.isRunning);
                    if (data.isRunning) setIsLoading(false);
                }
            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        };

        checkStatus();
        const intervalId = setInterval(checkStatus, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            palavra_chave: 'todays deals',
            pagina_inicial: 1,
            tag_amazon: 'linkalhub-20',
            cookies_amazon: '',
            instancia_whatsapp: 'Adriano',
            minutos_verificacao: 15,
        },
    });

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            const response = await fetch('/api/trigger-automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error('Erro ao comunicar com a API');
            }

            toast.success('Automação Iniciada!', {
                description: `Buscando ofertas para "${values.palavra_chave}"...`,
            });
        } catch (error) {
            console.error(error);
            toast.error('Erro na Automação', {
                description: 'Verifique se o Webhook do n8n está ativo e acessível.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function onStop() {
        setIsStopping(true);
        try {
            const response = await fetch('/api/stop-automation', {
                method: 'POST',
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao comunicar com a API');
            }

            toast.success('Pronto!', {
                description: data.message,
            });
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao Parar', {
                description: error.message || 'Verifique se a N8N_API_KEY está configurada corretamente.',
            });
        } finally {
            setIsStopping(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="palavra_chave"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-200">Palavra-Chave Amazon</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: iphone" className="bg-slate-950/50 border-slate-700 text-slate-100 placeholder:text-slate-500" {...field} />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="pagina_inicial"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-200">Página Inicial</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        className="bg-slate-950/50 border-slate-700 text-slate-100"
                                        {...field}
                                        onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="tag_amazon"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-200">Tag de Afiliado</FormLabel>
                                <FormControl>
                                    <Input placeholder="seu-codigo-20" className="bg-slate-950/50 border-slate-700 text-slate-100" {...field} />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="minutos_verificacao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-200">Espera (Minutos)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        className="bg-slate-950/50 border-slate-700 text-slate-100"
                                        {...field}
                                        onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                </FormControl>
                                <FormDescription className="text-slate-400">Tempo entre buscas</FormDescription>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="instancia_whatsapp"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel className="text-slate-200">Instância Evolution API (WhatsApp)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome da Instância" className="bg-slate-950/50 border-slate-700 text-slate-100" {...field} />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cookies_amazon"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel className="text-slate-200">Cookies da Amazon</FormLabel>
                                <FormControl>
                                    <Input placeholder="session-id=...; session-token=..." className="bg-slate-950/50 border-slate-700 text-slate-100 font-mono text-xs" {...field} />
                                </FormControl>
                                <FormDescription className="text-slate-400">Cole aqui os cookies necessários para o Bypass do Bot-Protection</FormDescription>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        type="submit"
                        disabled={isLoading || isStopping || isRunning}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20 transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Iniciando...' : isRunning ? 'Automação Ativa' : 'Iniciar Automação'}
                    </Button>

                    <Button
                        type="button"
                        onClick={onStop}
                        variant="destructive"
                        disabled={isLoading || isStopping || !isRunning}
                        className="flex-1 bg-red-600/90 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
                    >
                        {isStopping ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {isStopping ? 'Parando...' : 'Parar Automação'}
                    </Button>
                </div>

                <div className="mt-6 flex items-center justify-center p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                            {isRunning ? (
                                <>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </>
                            ) : (
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
                            )}
                        </div>
                        <span className="text-sm font-medium text-slate-300">
                            Status do Sistema: {isRunning ? <span className="text-green-400 font-bold">Rodando Extração</span> : <span>Em Espera (Parado)</span>}
                        </span>
                        {isRunning && <Activity className="w-4 h-4 text-green-400 animate-pulse ml-2" />}
                    </div>
                </div>

            </form>
        </Form >
    );
}
