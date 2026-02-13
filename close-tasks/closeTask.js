require('dotenv').config();

function extractTaskId(url) {
    const regex = /\/t\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function closeClickUpTask(taskId) {
    if (!taskId) {
        throw new Error("ID de tarea no encontrado");
    }

    const apiUrl = `https://api.clickup.com/api/v2/task/${taskId}`;

    const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Authorization': process.env.CLICKUP_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: "closed" })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error al cerrar la tarea (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    console.log(`Tarea ${taskId} cerrada con éxito`);
}

async function main() {
    const args = JSON.parse(process.argv[2]);
    const taskId = extractTaskId(args.freshdesk_webhook.ticket_cf_si);
    await closeClickUpTask(taskId);
}

main().catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
});
