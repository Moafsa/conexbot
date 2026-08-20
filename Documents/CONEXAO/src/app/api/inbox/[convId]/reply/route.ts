export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { convId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const tenantId = await getEffectiveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { convId } = params;
    const body = await req.json();
    const { text } = body;
    if (!text?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const conv = await prisma.conversation.findUnique({
        where: { id: convId },
        include: { bot: { select: { tenantId: true, id: true } } },
    });
    if (!conv || conv.bot.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Save message to DB
    const msg = await prisma.message.create({
        data: {
            conversationId: convId,
            content: text.trim(),
            role: 'assistant',
        },
    });

    // Send via UZAPI if bot has a session
    const UZAPI_URL = process.env.UZAPI_URL || 'http://localhost:21465';
    const sessionToken = `bot-${conv.botId}`;
    const phone = conv.remoteId.replace(/\D/g, '');
    const toJid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    try {
        await fetch(`${UZAPI_URL}/chat/send/text`, {
            method: 'POST',
            headers: { 'Token': sessionToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ Phone: toJid, Body: text.trim() }),
        });
    } catch (e: any) {
        console.error('[InboxReply] UZAPI send failed:', e.message);
    }

    // Update conversation updatedAt
    await prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

    return NextResponse.json({ message: msg });
}
