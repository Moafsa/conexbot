export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = (session.user as any).id;

    const bots = await prisma.bot.findMany({
        where: { tenantId },
        select: {
            id: true,
            name: true,
            status: true,
            channels: {
                where: { provider: 'META_WHATSAPP' },
                select: { id: true, status: true, identifier: true, credentials: true, updatedAt: true }
            },
            apiKeys: {
                where: { active: true },
                select: { id: true, name: true, key: true, webhookUrl: true, active: true, lastUsedAt: true, createdAt: true },
                orderBy: { createdAt: 'desc' }
            },
            _count: {
                select: { conversations: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // For each bot with a WhatsApp channel, get last 30-day message count
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const results = await Promise.all(bots.map(async (bot) => {
        const channel = bot.channels[0] || null;
        const creds = channel?.credentials as any;

        let msgLast30 = 0;
        let lastActivity: Date | null = null;

        if (channel) {
            const [msgCount, lastConv] = await Promise.all([
                prisma.message.count({
                    where: {
                        conversation: { botId: bot.id },
                        createdAt: { gte: thirtyDaysAgo }
                    }
                }),
                prisma.conversation.findFirst({
                    where: { botId: bot.id },
                    orderBy: { updatedAt: 'desc' },
                    select: { updatedAt: true }
                })
            ]);
            msgLast30 = msgCount;
            lastActivity = lastConv?.updatedAt ?? null;
        }

        return {
            id: bot.id,
            name: bot.name,
            status: bot.status,
            whatsapp: channel ? {
                status: channel.status,
                phoneId: channel.identifier,
                phoneNumber: creds?.phoneNumber || null,
                wabaId: creds?.wabaId || null,
                connectedAt: channel.updatedAt,
            } : null,
            stats: {
                totalConversations: bot._count.conversations,
                messagesLast30Days: msgLast30,
                lastActivity,
            },
            apiKeys: bot.apiKeys.map(k => ({
                id: k.id,
                name: k.name,
                keyPreview: `${k.key.slice(0, 8)}...${k.key.slice(-4)}`,
                webhookUrl: k.webhookUrl,
                active: k.active,
                lastUsedAt: k.lastUsedAt,
                createdAt: k.createdAt,
            }))
        };
    }));

    return NextResponse.json({ numbers: results, allBots: results });
}
