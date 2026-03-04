const fs = require('fs');

async function updateWorkflow() {
    const host = process.env.N8N_HOST || 'https://webhook.agilitytecno.com';
    const apiKey = process.env.N8N_API_KEY || 'N8N_API_KEY_HERE'; // The user usually has this in their env
    const workflowId = 'PQpIqqL5WErQVo1c';

    if (!process.env.N8N_API_KEY) {
        console.warn('WARNING: N8N_API_KEY not found in env, make sure it is set before running.');
    }

    try {
        const res = await fetch(`${host}/api/v1/workflows/${workflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey, 'Accept': 'application/json' }
        });

        if (!res.ok) {
            console.error('Failed to fetch workflow', await res.text());
            return;
        }

        const workflow = await res.json();
        const node = workflow.nodes.find(n => n.name === 'Formatar Ofertas com Keyword');

        if (!node) {
            console.error('Node not found');
            return;
        }

        const newCode = fs.readFileSync('new_code.js', 'utf8');
        node.parameters.jsCode = newCode;

        delete workflow.id;
        delete workflow.createdAt;
        delete workflow.updatedAt;

        const updateRes = await fetch(`${host}/api/v1/workflows/${workflowId}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(workflow)
        });

        if (updateRes.ok) {
            console.log("Fluxo atualizado com sucesso no n8n!");
        } else {
            console.error('Failed to update workflow', await updateRes.text());
        }
    } catch (e) {
        console.error("Error", e);
    }
}

updateWorkflow();
