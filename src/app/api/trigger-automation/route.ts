import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // The Webhook URL from the locally running n8n
        // TODO: Update this to the correct production/test webhook URL
        const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://webhook.agilitytecno.com/webhook/amazon-ofertas';

        console.log('Disparando automação para:', N8N_WEBHOOK_URL);
        console.log('Payload:', body);

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error('Erro na resposta do n8n:', response.status, response.statusText);
            return NextResponse.json(
                { error: 'Falha ao acionar a automação no n8n' },
                { status: response.status }
            );
        }

        const data = await response.json().catch(() => ({ message: 'Workflow iniciado (sem resposta JSON)' }));
        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Erro ao acionar webhook:', error);
        return NextResponse.json(
            { error: 'Erro interno ao acionar a automação' },
            { status: 500 }
        );
    }
}
