import prisma from "./prisma";

export async function getSubscriptionStatus(tenantId: string) {
    const subscription = await prisma.subscription.findUnique({
        where: { tenantId },
        include: { plan: true }
    });

    if (!subscription) {
        return { status: 'FREE', trialEnds: null }; 
    }

    return { status: subscription.status, plan: subscription.plan };
}

export function isSubscriptionActive(status: string) {
    return ['ACTIVE', 'TRIALING', 'FREE'].includes(status.toUpperCase());
}
