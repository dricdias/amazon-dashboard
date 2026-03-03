import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.N8N_API_KEY;
        const host = process.env.N8N_HOST || 'https://webhook.agilitytecno.com';

        if (!apiKey) {
            return NextResponse.json(
                { error: 'N8N_API_KEY não configurada no arquivo .env do servidor.' },
                { status: 400 }
            );
        }

        // Busca todas as execuções com status "waiting" ou "running"
        const response = await fetch(`${host}/api/v1/executions?status=waiting`, {
            method: 'GET',
            headers: {
                'X-N8N-API-KEY': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Erro na resposta do n8n ao buscar execuções:', response.status, response.statusText);
            return NextResponse.json(
                { error: 'Falha ao buscar execuções no n8n. Verifique a API Key.' },
                { status: response.status }
            );
        }

        const data = await response.json();
        const executions = data.data || [];

        if (executions.length === 0) {
            return NextResponse.json({ success: true, message: 'Nenhuma automação em andamento encontrada.' });
        }

        let stoppedCount = 0;

        // Para cada execução aguardando (waiting), mandamos o comando de stop
        for (const exec of executions) {
            const stopResponse = await fetch(`${host}/api/v1/executions/${exec.id}/stop`, {
                method: 'POST',
                headers: {
                    'X-N8N-API-KEY': apiKey,
                    'Accept': 'application/json'
                }
            });

            if (stopResponse.ok) {
                stoppedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `${stoppedCount} execução(ões) parada(s) com sucesso!`
        });

    } catch (error) {
        console.error('Erro ao parar webhook:', error);
        return NextResponse.json(
            { error: 'Erro interno ao tentar parar a automação' },
            { status: 500 }
        );
    }
}
