export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';
import { getPhoneVariations } from '@/lib/phone-utils';

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

    let searchOrConditions: any[] | null = null;

    if (search) {
        // 1. Find contacts by name or phone (all variations)
        const matchingContacts = await prisma.contact.findMany({
            where: {
                botId: { in: activeBotIds },
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ]
            },
            select: { phone: true, botId: true }
        });

        // Generate all phone variations so format mismatch doesn't break lookups
        const contactConditions = matchingContacts.flatMap(c =>
            getPhoneVariations(c.phone).map(v => ({ botId: c.botId!, remoteId: v }))
        );

        // 2. Find conversations whose messages contain the search term
        const matchingMessages = await prisma.message.findMany({
            where: {
                content: { contains: search, mode: 'insensitive' },
                conversation: { botId: { in: activeBotIds } },
            },
            select: { conversationId: true },
            distinct: ['conversationId'],
            take: 200,
        });
        const messageConvIds = matchingMessages.map(m => m.conversationId);

        searchOrConditions = [
            ...contactConditions,
            ...(messageConvIds.length > 0 ? [{ id: { in: messageConvIds } }] : []),
        ];
    }

    const convWhere: any = {
        botId: { in: activeBotIds },
        ...(status !== 'all' ? { status } : {}),
        ...(searchOrConditions !== null
            ? (searchOrConditions.length > 0 ? { OR: searchOrConditions } : { id: 'no-match' })
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

    // Enrich with contact info — try both the stored remoteId and all its variations
    const allPhoneVariants = [...new Set(conversations.flatMap(c => getPhoneVariations(c.remoteId)))];
    const contacts = await prisma.contact.findMany({
        where: { phone: { in: allPhoneVariants }, botId: { in: activeBotIds } },
        select: { phone: true, name: true, botId: true },
    });
    // Index by every variant so lookup always finds the right contact
    const contactMap = new Map<string, { name: string }>();
    for (const ct of contacts) {
        for (const v of getPhoneVariations(ct.phone)) {
            const key = `${ct.botId}:${v}`;
            if (!contactMap.has(key)) contactMap.set(key, ct);
        }
    }

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
