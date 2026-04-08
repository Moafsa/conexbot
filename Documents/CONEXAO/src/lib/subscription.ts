import prisma from "./prisma";

export async function getSubscriptionStatus(tenantId: string, type: 'PRIMARY' | 'WRITER_PLUGIN' = 'PRIMARY') {
    const subscription = await prisma.subscription.findUnique({
        where: { 
            tenantId_type: {
                tenantId,
                type
            }
        },
        include: { plan: true }
    });

    if (!subscription) {
        return { status: 'FREE', trialEnds: null }; 
    }

    return { status: subscription.status, plan: subscription.plan, subscription };
}

export function isSubscriptionActive(status: string) {
    return ['ACTIVE', 'TRIALING', 'FREE'].includes(status.toUpperCase());
}
