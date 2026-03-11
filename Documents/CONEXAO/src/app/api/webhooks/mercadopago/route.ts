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

        // MercadoPago sends notifications about payments
        if (body.type === 'payment') {
            const paymentId = body.data?.id;

            if (!paymentId) {
                return NextResponse.json({ received: true });
            }

            // Fetch payment details from MercadoPago API
            const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (!accessToken) {
                console.warn('MERCADOPAGO_ACCESS_TOKEN missing, skipping webhook');
                return NextResponse.json({ received: true });
            }

            const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (!paymentRes.ok) {
                console.error('Failed to fetch MP payment:', await paymentRes.text());
                return NextResponse.json({ received: true });
            }

            const payment = await paymentRes.json();

            if (payment.status === 'approved') {
                // Find tenant by email (external_reference)
                const email = payment.external_reference;
                const tenant = await prisma.tenant.findUnique({ where: { email } });

                if (tenant) {
                    // Determine plan from amount
                    const planName = payment.transaction_amount >= 197 ? 'pro' : 'starter';
                    const dbPlan = await prisma.plan.findFirst({ 
                        where: { name: { contains: planName, mode: 'insensitive' } } 
                    });
                    
                    const limits = PLAN_LIMITS[planName];
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);

                    // Create/update subscription
                    await prisma.subscription.upsert({
                        where: { tenantId: tenant.id },
                        update: { status: 'ACTIVE', planId: dbPlan?.id, gateway: 'mercadopago', externalId: String(paymentId) },
                        create: {
                            tenantId: tenant.id,
                            planId: dbPlan?.id,
                            status: 'ACTIVE',
                            gateway: 'mercadopago',
                            externalId: String(paymentId),
                        },
                    });

                    // Record payment
                    await prisma.payment.create({
                        data: {
                            tenantId: tenant.id,
                            amount: payment.transaction_amount,
                            status: 'PAID',
                            gateway: 'mercadopago',
                            externalId: String(paymentId),
                        },
                    });

                    // Update usage limits
                    await prisma.usageCounter.upsert({
                        where: { tenantId: tenant.id },
                        update: {
                            messagesUsed: 0,
                            messagesLimit: limits.messages,
                            botsLimit: limits.bots,
                            periodStart: new Date(),
                            periodEnd: nextMonth,
                        },
                        create: {
                            tenantId: tenant.id,
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
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('MercadoPago webhook error:', error);
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
