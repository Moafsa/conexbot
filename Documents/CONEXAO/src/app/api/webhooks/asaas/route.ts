import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const event = body.event;
        const payment = body.payment;

        if (!payment) return NextResponse.json({ received: true });

        const externalId = payment.id;
        const subscriptionId = payment.subscription;

        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_CREATED' || event === 'PAYMENT_UPDATED') {
            // 1. Handle Bot Orders (Only on Paid)
            if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
                const order = await prisma.order.findUnique({
                    where: { externalId: externalId },
                });

                if (order) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'PAID' }
                    });
                    console.log(`[Webhook] Bot Order ${order.id} marked as PAID`);
                }
            }

            // 2. Handle System Subscriptions
            const subscription = await prisma.subscription.findUnique({
                where: { externalId: subscriptionId || externalId },
                include: { tenant: true, plan: true }
            });

            if (subscription) {
                const newPaymentStatus = (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') ? 'PAID' : 'PENDING';
                
                if (newPaymentStatus === 'PAID') {
                    // Update subscription status to ACTIVE if a payment was received
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: 'ACTIVE' }
                    });
                }

                // Record or Update payment (Upsert to handle CREATED -> PAID transitions without duplicates)
                await prisma.payment.upsert({
                    where: { externalId: payment.id },
                    update: {
                        status: newPaymentStatus,
                        amount: payment.value,
                        invoiceUrl: payment.invoiceUrl || payment.bankSlipUrl,
                    },
                    create: {
                        tenantId: subscription.tenantId,
                        amount: payment.value,
                        status: newPaymentStatus,
                        externalId: payment.id,
                        invoiceUrl: payment.invoiceUrl || payment.bankSlipUrl,
                        gateway: 'ASAAS'
                    }
                });

                // Update usage limits based on plan ONLY IF it was just paid
                if (newPaymentStatus === 'PAID') {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);

                    const messagesLimit = subscription.plan?.messageLimit || 5000;
                    const botsLimit = subscription.plan?.botLimit || 1;

                    await prisma.usageCounter.upsert({
                        where: { tenantId: subscription.tenantId },
                        update: {
                            messagesUsed: 0,
                            messagesLimit: messagesLimit,
                            botsLimit: botsLimit,
                            periodStart: new Date(),
                            periodEnd: nextMonth,
                        },
                        create: {
                            tenantId: subscription.tenantId,
                            messagesUsed: 0,
                            messagesLimit: messagesLimit,
                            botsUsed: 0,
                            botsLimit: botsLimit,
                            periodStart: new Date(),
                            periodEnd: nextMonth,
                        },
                    });
                    console.log(`[Webhook] System Subscription ${subscription.id} usage updated for new payment`);
                }
            }
        }


        if (event === 'PAYMENT_OVERDUE') {
            const subscription = await prisma.subscription.findUnique({
                where: { externalId: subscriptionId },
            });

            if (subscription) {
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: 'PAST_DUE' },
                });
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Asaas webhook error:', error);
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
