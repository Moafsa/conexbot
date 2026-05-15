import prisma from '@/lib/prisma';

/**
 * Verifica se o tenant pode criar um novo bot.
 * Agências têm limite ilimitado no novo modelo de infraestrutura.
 */
export async function checkBotLimit(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Buscar perfil do usuário para verificar Role
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { role: true }
    });

    // Se for Agência ou Admin, o limite é ilimitado (Escala Reversa / Revenue Share)
    if (tenant?.role === 'AGENCY' || tenant?.role === 'SUPERADMIN' || tenant?.role === 'ADMIN') {
        return { allowed: true };
    }

    // Check subscription status para usuários normais
    const subscription = await prisma.subscription.findUnique({ 
        where: { tenantId_type: { tenantId, type: 'PRIMARY' } } 
    });
    
    if (subscription && ['PAST_DUE', 'INACTIVE', 'CANCELED'].includes(subscription.status)) {
        return { allowed: false, reason: 'Sua assinatura está vencida ou inativa. Regularize seu pagamento para criar novos agentes.' };
    }

    const counter = await prisma.usageCounter.findUnique({ where: { tenantId } });

    if (!counter) {
        // Sem contador = período de teste ou legatário, permite 10 bots
        const botCount = await prisma.bot.count({ where: { tenantId, status: 'active' } });
        return botCount < 10
            ? { allowed: true }
            : { allowed: false, reason: 'Limite de bots atingido. Entre em contato com sua agência para expandir.' };
    }

    return counter.botsUsed < counter.botsLimit
        ? { allowed: true }
        : { allowed: false, reason: 'Limite de bots atingido. Entre em contato com sua agência para expandir.' };
}

/**
 * Verifica o limite de mensagens.
 * Agências e Admins não têm limite de mensagens no novo modelo.
 */
export async function checkMessageLimit(tenantId: string): Promise<{ allowed: boolean; remaining: number }> {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { role: true }
    });

    if (tenant?.role === 'AGENCY' || tenant?.role === 'SUPERADMIN' || tenant?.role === 'ADMIN') {
        return { allowed: true, remaining: 999999 };
    }

    const subscription = await prisma.subscription.findUnique({ 
        where: { tenantId_type: { tenantId, type: 'PRIMARY' } } 
    });
    
    if (subscription && ['PAST_DUE', 'INACTIVE', 'CANCELED'].includes(subscription.status)) {
        return { allowed: false, remaining: 0 };
    }

    const counter = await prisma.usageCounter.findUnique({ where: { tenantId } });

    if (!counter) {
        return { allowed: true, remaining: 100 }; // Free trial: 100 mensagens
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
