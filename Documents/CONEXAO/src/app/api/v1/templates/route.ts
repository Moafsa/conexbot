export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { validateApiKey, extractApiKey } from '@/lib/api-key-auth';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

async function getMetaCreds(botId: string, tenantId: string) {
    const channel = await prisma.botChannel.findFirst({
        where: { botId, provider: 'META_WHATSAPP', status: 'CONNECTED' }
    });
    if (!channel) return null;
    const creds = channel.credentials as any;
    return {
        accessToken: creds?.accessToken as string,
        wabaId: creds?.wabaId as string,
        phoneId: channel.identifier as string
    };
}

async function resolveAuth(req: Request): Promise<{ accessToken: string; wabaId: string; phoneId: string } | null> {
    // Try API key first
    const rawKey = extractApiKey(req);
    if (rawKey) {
        const apiKey = await validateApiKey(rawKey);
        if (!apiKey) return null;
        const creds = apiKey.bot.channels?.[0]?.credentials as any;
        return {
            accessToken: creds?.accessToken,
            wabaId: creds?.wabaId,
            phoneId: apiKey.bot.channels?.[0]?.identifier || ''
        };
    }

    // Fall back to session auth (dashboard use)
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    const botId = new URL(req.url).searchParams.get('botId');
    if (!botId) return null;
    const tenantId = (session.user as any).id;
    const bot = await prisma.bot.findFirst({ where: { id: botId, tenantId } });
    if (!bot) return null;
    return getMetaCreds(botId, tenantId);
}

// GET /api/v1/templates?botId=xxx  — list templates
export async function GET(req: Request) {
    const creds = await resolveAuth(req);
    if (!creds?.wabaId || !creds?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized ou WhatsApp não conectado' }, { status: 401 });
    }

    const url = `${GRAPH_URL}/${creds.wabaId}/message_templates?fields=id,name,status,category,language,components&limit=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${creds.accessToken}` } });
    const data = await res.json();

    if (!res.ok) return NextResponse.json({ error: 'Erro Meta', details: data }, { status: res.status });

    return NextResponse.json({ templates: data.data || [], paging: data.paging });
}

// POST /api/v1/templates?botId=xxx  — create template
export async function POST(req: Request) {
    const creds = await resolveAuth(req);
    if (!creds?.wabaId || !creds?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized ou WhatsApp não conectado' }, { status: 401 });
    }

    let body: any;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    const { name, category, language, components } = body;
    if (!name || !category || !language || !components) {
        return NextResponse.json({
            error: 'Campos obrigatórios: name, category, language, components'
        }, { status: 400 });
    }

    const res = await fetch(`${GRAPH_URL}/${creds.wabaId}/message_templates`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${creds.accessToken}`
        },
        body: JSON.stringify({ name, category, language, components })
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: 'Erro Meta', details: data }, { status: res.status });

    return NextResponse.json({ success: true, id: data.id, status: data.status }, { status: 201 });
}

// DELETE /api/v1/templates?botId=xxx&name=template_name  — delete template
export async function DELETE(req: Request) {
    const creds = await resolveAuth(req);
    if (!creds?.wabaId || !creds?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized ou WhatsApp não conectado' }, { status: 401 });
    }

    const name = new URL(req.url).searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'Parâmetro "name" obrigatório' }, { status: 400 });

    const res = await fetch(`${GRAPH_URL}/${creds.wabaId}/message_templates?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${creds.accessToken}` }
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: 'Erro Meta', details: data }, { status: res.status });

    return NextResponse.json({ success: true });
}
