export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';
import { sendOutboundMessageToPhone } from '@/services/engine/outbound-notifier';

export async function POST(req: Request, { params }: { params: Promise<{ convId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const tenantId = await getEffectiveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { convId } = await params;
    const body = await req.json();
    const { text } = body;
    if (!text?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const conv = await prisma.conversation.findUnique({
        where: { id: convId },
        include: { bot: true },
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

    // Send via the best available channel (Meta Cloud API or UZAPI)
    const result = await sendOutboundMessageToPhone(conv.bot, conv.remoteId, text.trim());
    if (!result.success) {
        console.error('[InboxReply] Send failed:', result.error);
    }

    // Pause bot for 30 minutes so AI does not interrupt human agent
    const pausedUntil = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date(), pausedUntil } as any });

    return NextResponse.json({ message: msg, sent: result.success, error: result.error || null });
}
