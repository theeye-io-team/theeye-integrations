require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const CLICKUP_TOKEN = process.env.CLICKUP_TOKEN;
const FRESHDESK_KEY = process.env.FRESHDESK_KEY;
const FRESHDESK_PASS = process.env.FRESHDESK_PASS;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const FRESHDESK_BASE = 'https://theeye.freshdesk.com/api/v2';
const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';
const FRESHDESK_CUSTOM_FIELD_ID = '3f7c2ea7-03a1-4d09-b6b7-37879f1c2be5';
const GEMINI_MODEL = 'gemini-3-flash-preview';

function extractTaskId(url) {
    const regex = /\/t\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function buildFreshdeskAuthHeader() {
    const credentials = Buffer.from(`${FRESHDESK_KEY}:${FRESHDESK_PASS}`).toString('base64');
    return `Basic ${credentials}`;
}

async function getClickUpTaskDetails(taskId) {
    const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
        headers: { 'Authorization': CLICKUP_TOKEN }
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error al obtener tarea ClickUp (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    return response.json();
}

function extractFreshdeskTicketId(taskData) {
    const customFields = taskData.custom_fields || [];
    const field = customFields.find(f => f.id === FRESHDESK_CUSTOM_FIELD_ID);
    if (!field || !field.value) return null;

    const match = field.value.match(/\/tickets\/(\d+)/);
    return match ? match[1] : null;
}

async function getFreshdeskTicket(ticketId) {
    const response = await fetch(`${FRESHDESK_BASE}/tickets/${ticketId}`, {
        headers: { 'Authorization': buildFreshdeskAuthHeader() }
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error al obtener ticket Freshdesk (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    return response.json();
}

async function getFreshdeskConversations(ticketId) {
    const response = await fetch(`${FRESHDESK_BASE}/tickets/${ticketId}/conversations`, {
        headers: { 'Authorization': buildFreshdeskAuthHeader() }
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error al obtener conversaciones Freshdesk (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    return response.json();
}

function buildGeminiPrompt(ticket, conversations) {
    const conversationLines = conversations.map(c => {
        const role = c.incoming ? '[Cliente]' : '[Soporte]';
        const note = c.private ? ' [nota interna]' : '';
        const body = c.body_text || c.body || '';
        return `${role}${note}: ${body}`;
    }).join('\n');

    return `Eres un asistente de soporte técnico. Genera un resumen conciso del siguiente ticket de soporte.
El resumen debe incluir: problema reportado, acciones tomadas y resolución final. Máximo 200 palabras. Responde en español.

ASUNTO: ${ticket.subject}
DESCRIPCIÓN INICIAL: ${ticket.description_text || ''}
CONVERSACIÓN:
${conversationLines}`;
}

async function generateGeminiSummary(ticket, conversations) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = buildGeminiPrompt(ticket, conversations);

    const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
    });

    return result.text;
}

async function postClickUpComment(taskId, text) {
    const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}/comment`, {
        method: 'POST',
        headers: {
            'Authorization': CLICKUP_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment_text: text })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error al publicar comentario ClickUp (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    console.log(`Comentario publicado en tarea ${taskId}`);
}

async function closeClickUpTask(taskId) {
    if (!taskId) {
        throw new Error("ID de tarea no encontrado");
    }

    const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
        method: 'PUT',
        headers: {
            'Authorization': CLICKUP_TOKEN,
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
    if (!taskId) throw new Error("No se pudo extraer el ID de la tarea ClickUp");

    try {
        const taskData = await getClickUpTaskDetails(taskId);
        const freshdeskTicketId = extractFreshdeskTicketId(taskData);

        if (!freshdeskTicketId) {
            console.log('Sin URL Freshdesk en campos ClickUp, se omite resumen.');
        } else {
            const [ticket, conversations] = await Promise.all([
                getFreshdeskTicket(freshdeskTicketId),
                getFreshdeskConversations(freshdeskTicketId)
            ]);
            const summary = await generateGeminiSummary(ticket, conversations);
            const commentText = `*Resumen automático del incidente (generado por IA)*\n\n${summary}`;
            await postClickUpComment(taskId, commentText);
        }
    } catch (summaryError) {
        console.error(`Advertencia: No se pudo generar el resumen: ${summaryError.message}`);
    }

    await closeClickUpTask(taskId);
}

main().catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
});
