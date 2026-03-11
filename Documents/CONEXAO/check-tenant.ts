import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'f1ea4e70-ccd5-4918-b7e7-4304c2425a47';
    
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
            usageCounter: true,
            subscription: {
                include: { plan: true }
            }
        }
    });
    
    console.log(JSON.stringify(tenant, null, 2));

    // Fix usage counter based on plan if missing or low
    if (tenant?.subscription?.plan) {
        const plan = tenant.subscription.plan;
        await prisma.usageCounter.upsert({
            where: { tenantId },
            update: {
                messagesLimit: plan.messageLimit,
                botsLimit: plan.botLimit
            },
            create: {
                tenantId,
                messagesUsed: 0,
                messagesLimit: plan.messageLimit,
                botsUsed: 0,
                botsLimit: plan.botLimit,
                periodStart: new Date(),
                periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
        console.log("Usage Counter Fixed for Tenant!");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
