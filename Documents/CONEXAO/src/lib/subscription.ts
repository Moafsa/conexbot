import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSubscriptionStatus(tenantId: string) {
    const subscription = await prisma.subscription.findUnique({
        where: { tenantId },
    });

    if (!subscription) {
        return { status: 'free', trialEnds: null }; // Or check creation date for 7-day trial
    }

    return { status: subscription.status, plan: subscription.plan };
}

export function isSubscriptionActive(status: string) {
    return ['active', 'trialing'].includes(status);
}
