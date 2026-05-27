export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;

        // Fetch tenant info including agency relationship
        const tenantBase = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                agencyId: true,
                role: true,
                managedBy: {
                    select: {
                        id: true,
                        tenant: { select: { name: true, whatsapp: true, email: true } },
                    },
                },
            },
        });

        const isAgencyClient = !!(tenantBase?.agencyId && tenantBase?.role === 'USER');
        const agencyInfo = isAgencyClient && tenantBase?.managedBy ? {
            name: tenantBase.managedBy.tenant?.name || 'Sua Agência',
            whatsapp: tenantBase.managedBy.tenant?.whatsapp || null,
            email: tenantBase.managedBy.tenant?.email || null,
        } : null;

        // Aggregate analytics
        const [
            totalBots,
            activeBots,
            totalConversations,
            totalMessages,
            recentMessages,
            subscription,
            usageCounter,
            tenantDetails,
            connectedBots,
        ] = await Promise.all([
            prisma.bot.count({ where: { tenantId } }),
            prisma.bot.count({ where: { tenantId, status: 'ACTIVE' } }),
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
            prisma.subscription.findFirst({
                where: {
                    tenantId,
                    type: 'PRIMARY',
                    status: { in: ['ACTIVE', 'TRIALING', 'PENDING', 'PAST_DUE'] },
                },
                include: { plan: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.usageCounter.findUnique({ where: { tenantId } }),
            prisma.tenant.findUnique({
                where: { id: tenantId },
                select: {
                    openaiApiKey: true,
                    geminiApiKey: true,
                    openrouterApiKey: true,
                    elevenLabsApiKey: true,
                    asaasApiKey: true
                }
            }),
            prisma.bot.count({ where: { tenantId, connectionStatus: 'CONNECTED' } }),
        ]);

        // For agency clients: fetch primary bot details
        let primaryBot = null;
        if (isAgencyClient) {
            primaryBot = await prisma.bot.findFirst({
                where: { tenantId, status: 'active' },
                select: {
                    id: true,
                    name: true,
                    niche: true,
                    connectionStatus: true,
                    channels: { select: { provider: true, identifier: true, status: true } },
                    _count: {
                        select: {
                            conversations: true,
                            contacts: true,
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
            });
        }

        const hasAiKeys = !!(tenantDetails?.openaiApiKey || tenantDetails?.geminiApiKey || tenantDetails?.openrouterApiKey);
        const hasElevenLabs = !!tenantDetails?.elevenLabsApiKey;
        const hasAsaas = !!tenantDetails?.asaasApiKey;

        // Check if bots have advanced config
        const [botsWithVoice, botsWithBuffer, followupRulesCount] = await Promise.all([
            prisma.bot.count({ where: { tenantId, voiceId: { not: null } } }),
            prisma.bot.count({ where: { tenantId, messageBuffer: { gt: 0 } } }),
            prisma.followupRule.count({ where: { tenantId } })
        ]);

        const hasVoiceConfig = botsWithVoice > 0;
        const hasAdvancedConfig = botsWithBuffer > 0 || followupRulesCount > 0;

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
                plan: subscription.plan?.name || "Plano Ativo",
                status: subscription.status,
            } : null,
            usage: usageCounter ? {
                messagesUsed: usageCounter.messagesUsed,
                messagesLimit: usageCounter.messagesLimit || (subscription?.plan?.messageLimit),
                botsUsed: usageCounter.botsUsed,
                botsLimit: usageCounter.botsLimit || (subscription?.plan?.botLimit),
            } : null,
            onboarding: {
                hasAiKeys,
                hasBots: totalBots > 0,
                hasConnections: connectedBots > 0,
                hasElevenLabs,
                hasAsaas,
                hasVoiceConfig,
                hasAdvancedConfig
            },
            // Agency client context
            isAgencyClient,
            agencyInfo,
            primaryBot,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Falha ao buscar analytics' }, { status: 500 });
    }
}

