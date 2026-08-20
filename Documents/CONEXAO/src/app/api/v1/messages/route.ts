export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { validateApiKey, extractApiKey } from '@/lib/api-key-auth';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * POST /api/v1/messages
 * Authorization: Bearer <api_key>
 *
 * Body: same format as Meta Cloud API POST /{phone-number-id}/messages
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 *
 * Example (text):
 * { "to": "5511999...", "type": "text", "text": { "body": "Olá!" } }
 *
 * Example (template):
 * { "to": "5511999...", "type": "template", "template": { "name": "hello_world", "language": { "code": "pt_BR" }, "components": [] } }
 */
export async function POST(req: Request) {
    const rawKey = extractApiKey(req);
    const apiKey = await validateApiKey(rawKey || '');
    if (!apiKey) {
        return NextResponse.json({
            error: 'Unauthorized',
            message: 'API key inválida ou inativa. Envie no header: Authorization: Bearer <sua_key>'
        }, { status: 401 });
    }

    const metaChannel = apiKey.bot.channels?.[0];
    if (!metaChannel || metaChannel.status !== 'CONNECTED') {
        return NextResponse.json({
            error: 'WhatsApp não conectado',
            message: 'O bot associado a esta key não possui um número WhatsApp ativo.'
        }, { status: 400 });
    }

    const creds = metaChannel.credentials as any;
    const phoneId = metaChannel.identifier;
    const accessToken = creds?.accessToken;

    if (!phoneId || !accessToken) {
        return NextResponse.json({ error: 'Credenciais Meta incompletas' }, { status: 500 });
    }

    let body: any;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    if (!body.to) {
        return NextResponse.json({ error: 'Campo "to" obrigatório' }, { status: 400 });
    }

    // Forward to Meta Cloud API
    const metaPayload = { messaging_product: 'whatsapp', ...body };

    const metaRes = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(metaPayload)
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
        return NextResponse.json({
            error: 'Erro da API Meta',
            details: metaData
        }, { status: metaRes.status });
    }

    return NextResponse.json({
        success: true,
        messages: metaData.messages,
        contacts: metaData.contacts
    });
}
