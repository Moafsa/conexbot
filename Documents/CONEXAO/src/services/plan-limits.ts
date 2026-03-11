import prisma from '@/lib/prisma';

// Limits are now managed via Database (Plan model) and UsageCounter record.

export async function checkBotLimit(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Development mode bypass
    if (process.env.NODE_ENV === 'development') {
        return { allowed: true };
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

