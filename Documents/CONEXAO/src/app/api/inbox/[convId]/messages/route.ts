export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ convId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const tenantId = await getEffectiveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { convId } = await params;
    const conv = await prisma.conversation.findUnique({
        where: { id: convId },
        include: { bot: { select: { tenantId: true, id: true, name: true } } },
    });
    if (!conv || conv.bot.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: 'asc' },
    });

    const contact = await prisma.contact.findFirst({
        where: { phone: conv.remoteId, botId: conv.botId },
        select: { id: true, name: true, phone: true, email: true, notes: true, tags: true, leadScore: true, funnelStage: true },
    });

    return NextResponse.json({ messages, contact, conversation: { id: conv.id, remoteId: conv.remoteId, status: conv.status, botId: conv.botId, botName: conv.bot.name }, nextCursor: null });
}
