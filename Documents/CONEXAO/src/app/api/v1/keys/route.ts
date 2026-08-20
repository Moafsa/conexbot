export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

function getBotId(req: Request) {
    return new URL(req.url).searchParams.get('botId');
}

async function resolveSession(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    const botId = getBotId(req);
    if (!botId) return null;
    const tenantId = (session.user as any).id;
    const bot = await prisma.bot.findFirst({ where: { id: botId, tenantId } });
    if (!bot) return null;
    return { tenantId, botId, bot };
}

// GET /api/v1/keys?botId=xxx — list all API keys for a bot
export async function GET(req: Request) {
    const ctx = await resolveSession(req);
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const keys = await prisma.apiKey.findMany({
        where: { botId: ctx.botId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, name: true, key: true, webhookUrl: true,
            active: true, lastUsedAt: true, createdAt: true
        }
    });

    // Mask key: show only first 8 + last 4 chars
    const masked = keys.map(k => ({
        ...k,
        keyPreview: `${k.key.slice(0, 8)}...${k.key.slice(-4)}`
    }));

    return NextResponse.json({ keys: masked });
}

// POST /api/v1/keys?botId=xxx — create a new API key
export async function POST(req: Request) {
    const ctx = await resolveSession(req);
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { name = 'API Key', webhookUrl, webhookSecret } = body;

    const key = `cxk_${crypto.randomBytes(24).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
        data: {
            key,
            name,
            botId: ctx.botId,
            tenantId: ctx.tenantId,
            webhookUrl: webhookUrl || null,
            webhookSecret: webhookSecret || null,
        }
    });

    return NextResponse.json({
        id: apiKey.id,
        name: apiKey.name,
        key,  // returned in full only on creation
        webhookUrl: apiKey.webhookUrl,
        createdAt: apiKey.createdAt,
        message: 'Guarde esta chave agora — ela não será exibida novamente.'
    }, { status: 201 });
}

// PATCH /api/v1/keys?botId=xxx — update webhook URL or name
export async function PATCH(req: Request) {
    const ctx = await resolveSession(req);
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { id, name, webhookUrl, webhookSecret, active } = body;
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

    const existing = await prisma.apiKey.findFirst({ where: { id, botId: ctx.botId } });
    if (!existing) return NextResponse.json({ error: 'Key não encontrada' }, { status: 404 });

    const updated = await prisma.apiKey.update({
        where: { id },
        data: {
            ...(name !== undefined && { name }),
            ...(webhookUrl !== undefined && { webhookUrl }),
            ...(webhookSecret !== undefined && { webhookSecret }),
            ...(active !== undefined && { active }),
        }
    });

    return NextResponse.json({ success: true, id: updated.id, active: updated.active });
}

// DELETE /api/v1/keys?botId=xxx&id=yyy — delete an API key
export async function DELETE(req: Request) {
    const ctx = await resolveSession(req);
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

    const existing = await prisma.apiKey.findFirst({ where: { id, botId: ctx.botId } });
    if (!existing) return NextResponse.json({ error: 'Key não encontrada' }, { status: 404 });

    await prisma.apiKey.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
