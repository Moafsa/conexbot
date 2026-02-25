import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PLAN_LIMITS: Record<string, { messages: number; bots: number }> = {
    starter: { messages: 500, bots: 1 },
    pro: { messages: 999999, bots: 3 },
    enterprise: { messages: 999999, bots: 999 },
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const event = body.event;

        // Asaas webhook events: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, etc.
        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            const payment = body.payment;
            const customerId = payment.customer;

            // Find tenant by external subscription reference
            const subscription = await prisma.subscription.findFirst({
                where: { externalId: payment.subscription || customerId, gateway: 'asaas' },
            });

            if (subscription) {
                // Update subscription status
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: 'active' },
                });

                // Record payment
                await prisma.payment.create({
                    data: {
                        tenantId: subscription.tenantId,
                        amount: payment.value,
                        status: 'paid',
                        gateway: 'asaas',
                        externalId: payment.id,
                        invoiceUrl: payment.invoiceUrl,
                    },
                });

                // Update usage limits based on plan
                const limits = PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.starter;
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);

                await prisma.usageCounter.upsert({
                    where: { tenantId: subscription.tenantId },
                    update: {
                        messagesUsed: 0,
                        messagesLimit: limits.messages,
                        botsLimit: limits.bots,
                        periodStart: new Date(),
                        periodEnd: nextMonth,
                    },
                    create: {
                        tenantId: subscription.tenantId,
                        messagesUsed: 0,
                        messagesLimit: limits.messages,
                        botsUsed: 0,
                        botsLimit: limits.bots,
                        periodStart: new Date(),
                        periodEnd: nextMonth,
                    },
                });
            }
        }

        if (event === 'PAYMENT_OVERDUE') {
            const payment = body.payment;
            const subscription = await prisma.subscription.findFirst({
                where: { externalId: payment.subscription, gateway: 'asaas' },
            });

            if (subscription) {
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: 'past_due' },
                });
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Asaas webhook error:', error);
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
