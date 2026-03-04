import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.N8N_API_KEY;
        const host = process.env.N8N_HOST || 'https://webhook.agilitytecno.com';

        if (!apiKey) {
            return NextResponse.json(
                { error: 'N8N_API_KEY não configurada no arquivo .env' },
                { status: 400 }
            );
        }

        const headers = { 'X-N8N-API-KEY': apiKey, 'Accept': 'application/json' };

        // Buscando automações ativas / rodando
        const resWaiting = await fetch(`${host}/api/v1/executions?status=waiting`, { method: 'GET', headers });
        const resRunning = await fetch(`${host}/api/v1/executions?status=running`, { method: 'GET', headers });

        if (!resWaiting.ok || !resRunning.ok) {
            return NextResponse.json({ error: 'Falha ao buscar status' }, { status: 500 });
        }

        const dataWaiting = await resWaiting.json();
        const dataRunning = await resRunning.json();

        const activeExecutions = [...(dataWaiting.data || []), ...(dataRunning.data || [])];
        const isRunning = activeExecutions.length > 0;

        return NextResponse.json({
            success: true,
            isRunning: isRunning,
            activeCount: activeExecutions.length
        });
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        return NextResponse.json(
            { error: 'Erro interno ao verificar o status da automação' },
            { status: 500 }
        );
    }
}
