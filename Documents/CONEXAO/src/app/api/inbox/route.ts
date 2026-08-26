export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';
import { getPhoneVariations } from '@/lib/phone-utils';

// Returns all phone variants including versions with/without Brazil country code (55)
// so that contacts stored in different formats are always found.
function allPhoneFormats(phone: string): string[] {
    const base = getPhoneVariations(phone);
    const result = new Set(base);
    for (const v of base) {
        if (v.startsWith('55') && v.length > 4) result.add(v.slice(2));
    }
    return Array.from(result);
}

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

        // Generate all phone formats (with/without country code, with/without 9th digit)
        const contactConditions = matchingContacts.flatMap(c =>
            allPhoneFormats(c.phone).map(v => ({ botId: c.botId!, remoteId: v }))
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

    // Enrich with contact info — use all phone formats to bridge mismatches
    const allPhoneVariants = [...new Set(conversations.flatMap(c => allPhoneFormats(c.remoteId)))];
    const contacts = await prisma.contact.findMany({
        where: { phone: { in: allPhoneVariants }, botId: { in: activeBotIds } },
        select: { phone: true, name: true, botId: true },
    });
    // Index by every format variant so lookup always finds the right contact
    const contactMap = new Map<string, { name: string }>();
    for (const ct of contacts) {
        for (const v of allPhoneFormats(ct.phone)) {
            const key = `${ct.botId}:${v}`;
            if (!contactMap.has(key)) contactMap.set(key, ct);
        }
    }

    const allBots = await prisma.bot.findMany({
        where: { tenantId },
        select: { id: true, name: true },
    });

    // Count unanswered user messages (messages from 'user' since last 'assistant' reply)
    // One efficient raw query for all conversations at once
    const convIds = conversations.map(c => c.id);
    const unreadRows = convIds.length > 0
        ? await prisma.$queryRaw<{ conversationId: string; unread: bigint }[]>`
            SELECT m."conversationId", COUNT(*) AS unread
            FROM "Message" m
            WHERE m."conversationId" = ANY(${convIds}::uuid[])
              AND m.role = 'user'
              AND m."createdAt" > COALESCE(
                (SELECT MAX(m2."createdAt") FROM "Message" m2
                 WHERE m2."conversationId" = m."conversationId" AND m2.role = 'assistant'),
                '1900-01-01'::timestamptz
              )
            GROUP BY m."conversationId"
          `
        : [];
    const unreadMap = new Map(unreadRows.map(r => [r.conversationId, Number(r.unread)]));

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
            unreadCount: unreadMap.get(conv.id) || 0,
            lastMessage: lastMsg ? { content: lastMsg.content.substring(0, 100), role: lastMsg.role, createdAt: lastMsg.createdAt } : null,
        };
    });

    const nextCursor = conversations.length === PAGE ? conversations[conversations.length - 1].updatedAt.toISOString() : null;

    return NextResponse.json({ conversations: result, bots: allBots, nextCursor });
}
