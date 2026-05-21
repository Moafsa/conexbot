export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Cron: renew expired UsageCounter periods.
 * Schedule: daily at 00:05 UTC.
 *
 * Finds all tenants whose periodEnd has passed, resets their counters,
 * and sets the next period based on their active subscription interval.
 */
export async function GET(req: Request) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = req.headers.get('authorization');
        if (auth !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const now = new Date();

    // Find all expired counters
    const expired = await prisma.usageCounter.findMany({
        where: { periodEnd: { lt: now } },
        include: {
            tenant: {
                include: {
                    subscriptions: {
                        where: { status: { in: ['ACTIVE', 'TRIALING'] }, type: 'PRIMARY' },
                        include: { plan: true },
                        take: 1,
                    },
                },
            },
        },
    });

    let renewed = 0;
    let errors = 0;

    for (const counter of expired) {
        try {
            const sub = counter.tenant.subscriptions[0];
            const plan = sub?.plan;

            // Determine next period length from subscription interval
            const intervalDays = (() => {
                const interval = sub?.interval || plan?.interval;
                if (!interval) return 30;
                if (interval === 'YEARLY') return 365;
                if (interval === 'QUARTERLY') return 90;
                if (interval === 'SEMIANNUAL') return 180;
                return 30; // MONTHLY default
            })();

            const newPeriodStart = now;
            const newPeriodEnd = new Date(now.getTime() + intervalDays * 86_400_000);

            const newMessagesLimit = plan?.messageLimit ?? counter.messagesLimit;
            const newBotsLimit = plan?.botLimit ?? counter.botsLimit;

            await prisma.usageCounter.update({
                where: { id: counter.id },
                data: {
                    messagesUsed: 0,
                    botsUsed: 0,
                    periodStart: newPeriodStart,
                    periodEnd: newPeriodEnd,
                    messagesLimit: newMessagesLimit,
                    botsLimit: newBotsLimit,
                    warned90: false,
                    warned100: false,
                },
            });

            renewed++;
        } catch (err: any) {
            console.error(`[Cron/renew-usage] Error renewing counter ${counter.id}:`, err.message);
            errors++;
        }
    }

    console.log(`[Cron/renew-usage] Renewed ${renewed} counters, ${errors} errors.`);
    return NextResponse.json({ success: true, renewed, errors, timestamp: now });
}
