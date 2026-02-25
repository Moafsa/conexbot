import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;

        // Aggregate analytics
        const [
            totalBots,
            activeBots,
            totalConversations,
            totalMessages,
            recentMessages,
            subscription,
            usageCounter,
        ] = await Promise.all([
            prisma.bot.count({ where: { tenantId } }),
            prisma.bot.count({ where: { tenantId, status: 'active' } }),
            prisma.conversation.count({
                where: { bot: { tenantId } },
            }),
            prisma.message.count({
                where: { conversation: { bot: { tenantId } } },
            }),
            prisma.message.count({
                where: {
                    conversation: { bot: { tenantId } },
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
            }),
            prisma.subscription.findUnique({ where: { tenantId } }),
            prisma.usageCounter.findUnique({ where: { tenantId } }),
        ]);

        // Messages by role
        const userMessages = await prisma.message.count({
            where: {
                conversation: { bot: { tenantId } },
                role: 'user',
            },
        });

        return NextResponse.json({
            bots: { total: totalBots, active: activeBots },
            conversations: totalConversations,
            messages: {
                total: totalMessages,
                received: userMessages,
                sent: totalMessages - userMessages,
                last24h: recentMessages,
            },
            subscription: subscription ? {
                plan: subscription.plan,
                status: subscription.status,
            } : null,
            usage: usageCounter ? {
                messagesUsed: usageCounter.messagesUsed,
                messagesLimit: usageCounter.messagesLimit,
                botsUsed: usageCounter.botsUsed,
                botsLimit: usageCounter.botsLimit,
            } : null,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Falha ao buscar analytics' }, { status: 500 });
    }
}
