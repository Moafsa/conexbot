export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const tenantId = await getEffectiveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const botId = searchParams.get('botId');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const cursor = searchParams.get('cursor');
    const PAGE = 40;

    const bots = await prisma.bot.findMany({
        where: { tenantId },
        select: { id: true }
    });
    const botIds = bots.map(b => b.id);
    if (botIds.length === 0) return NextResponse.json({ conversations: [], bots: [], total: 0 });

    const activeBotIds = botId ? [botId] : botIds;

    // Get contacts matching search
    const contactWhere = search
        ? {
            botId: { in: activeBotIds },
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search } },
            ]
        }
        : { botId: { in: activeBotIds } };

    const matchingContacts = search
        ? await prisma.contact.findMany({ where: contactWhere, select: { phone: true, botId: true } })
        : null;

    const convWhere: any = {
        botId: { in: activeBotIds },
        ...(status !== 'all' ? { status } : {}),
        ...(matchingContacts
            ? { OR: matchingContacts.map(c => ({ botId: c.botId!, remoteId: c.phone })) }
            : {}),
        ...(cursor ? { updatedAt: { lt: new Date(cursor) } } : {}),
    };

    const conversations = await prisma.conversation.findMany({
        where: convWhere,
        orderBy: { updatedAt: 'desc' },
        take: PAGE,
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { content: true, role: true, createdAt: true },
            },
            bot: { select: { id: true, name: true } },
        },
    });

    // Enrich with contact info
    const phones = [...new Set(conversations.map(c => c.remoteId))];
    const contacts = await prisma.contact.findMany({
        where: { phone: { in: phones }, botId: { in: activeBotIds } },
        select: { phone: true, name: true, botId: true },
    });
    const contactMap = new Map(contacts.map(c => [`${c.botId}:${c.phone}`, c]));

    const allBots = await prisma.bot.findMany({
        where: { tenantId },
        select: { id: true, name: true },
    });

    const result = conversations.map(conv => {
        const contact = contactMap.get(`${conv.botId}:${conv.remoteId}`);
        const lastMsg = conv.messages[0];
        return {
            id: conv.id,
            remoteId: conv.remoteId,
            status: conv.status,
            botId: conv.botId,
            botName: conv.bot.name,
            updatedAt: conv.updatedAt,
            contactName: contact?.name || null,
            lastMessage: lastMsg ? { content: lastMsg.content.substring(0, 100), role: lastMsg.role, createdAt: lastMsg.createdAt } : null,
        };
    });

    const nextCursor = conversations.length === PAGE ? conversations[conversations.length - 1].updatedAt.toISOString() : null;

    return NextResponse.json({ conversations: result, bots: allBots, nextCursor });
}
