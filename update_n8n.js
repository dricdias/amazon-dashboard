const fs = require('fs');

async function updateWorkflow() {
    const host = process.env.N8N_HOST || 'https://webhook.agilitytecno.com';
    const apiKey = process.env.N8N_API_KEY;
    const workflowId = 'PQpIqqL5WErQVo1c';

    if (!apiKey) {
        console.error('N8N_API_KEY is required in the environment variables');
        process.exit(1);
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

        let code = node.parameters.jsCode;

        // Replace seenAsins initialization
        const initRegex = /\/\/ Conjunto para evitar itens duplicados \(mesmo ASIN\)\nconst seenAsins = new Set\(\);/;
        const newInit = `// Conjunto para evitar itens duplicados (mesmo ASIN)
const staticData = $getWorkflowStaticData("global");
staticData.seenAsins = staticData.seenAsins || [];
const seenAsins = new Set(staticData.seenAsins);`;

        code = code.replace(initRegex, newInit);

        // Save back to static data at the end of the script before products.sort()
        const endRegex = /\/\/ Shuffle products to give a good mix of organic results/;
        const newEnd = `// Save seenAsins back to staticData (limit to 1000 items to avoid bloated state)
staticData.seenAsins = Array.from(seenAsins);
if (staticData.seenAsins.length > 1000) {
    staticData.seenAsins = staticData.seenAsins.slice(-1000);
}

// Shuffle products to give a good mix of organic results`;

        if (!code.includes('staticData.seenAsins = Array.from(seenAsins);')) {
            code = code.replace(endRegex, newEnd);
        }

        node.parameters.jsCode = code;

        fs.writeFileSync('new_code.js', code);

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
            console.log("Fluxo atualizado com sucesso!");
        } else {
            console.error('Failed to update workflow', await updateRes.text());
        }
    } catch (e) {
        console.error("Error", e);
    }
}

updateWorkflow();
