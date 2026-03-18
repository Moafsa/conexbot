import prisma from '@/lib/prisma';

// Limits are now managed via Database (Plan model) and UsageCounter record.

export async function checkBotLimit(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Development mode bypass
    if (process.env.NODE_ENV === 'development') {
        return { allowed: true };
    }

    // Check subscription status
    const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
    if (subscription && ['PAST_DUE', 'INACTIVE', 'CANCELED'].includes(subscription.status)) {
        return { allowed: false, reason: 'Sua assinatura está vencida ou inativa. Regularize seu pagamento para criar novos agentes.' };
    }

    const counter = await prisma.usageCounter.findUnique({ where: { tenantId } });


    if (!counter) {
        // No counter = free tier, allow 10 bots for testing
        const botCount = await prisma.bot.count({ where: { tenantId, status: 'active' } });
        return botCount < 10
            ? { allowed: true }
            : { allowed: false, reason: 'Limite de bots atingido. Faça upgrade do seu plano.' };
    }

    return counter.botsUsed < counter.botsLimit
        ? { allowed: true }
        : { allowed: false, reason: 'Limite de bots atingido. Faça upgrade do seu plano.' };
}

export async function checkMessageLimit(tenantId: string): Promise<{ allowed: boolean; remaining: number }> {
    const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
    if (subscription && ['PAST_DUE', 'INACTIVE', 'CANCELED'].includes(subscription.status)) {
        return { allowed: false, remaining: 0 };
    }

    const counter = await prisma.usageCounter.findUnique({ where: { tenantId } });

    if (!counter) {
        return { allowed: true, remaining: 50 }; // Free trial: 50 messages
    }

    if (counter.messagesLimit === 0) {
        return { allowed: true, remaining: 999999 }; // 0 = Unlimited
    }

    const remaining = counter.messagesLimit - counter.messagesUsed;
    return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
    };
}

