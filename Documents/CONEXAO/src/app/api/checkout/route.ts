import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validations';
import { AsaasService } from '@/services/payment/asaas';
import { MercadoPagoService } from '@/services/payment/mercadopago';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;
        const body = await req.json();
        const parsed = checkoutSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { plan: planId, interval, gateway } = parsed.data;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        // Fetch plan details for pricing
        let plan = await prisma.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            plan = await prisma.plan.findFirst({
                where: { name: { equals: planId, mode: 'insensitive' } }
            });
        }

        if (!plan) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
        }

        // Prevent API bypass downsells
        const activeBotsCount = await prisma.bot.count({
            where: { tenantId }
        });

        if (plan.botLimit > 0 && plan.botLimit < activeBotsCount) {
            return NextResponse.json({ error: `Você possui ${activeBotsCount} agentes ativos. Para assinar este plano, primeiro exclua ou desative agentes excedentes.` }, { status: 400 });
        }

        let value = plan.price;
        if (interval === 'QUARTERLY') value = plan.priceQuarterly || plan.price * 3;
        if (interval === 'SEMIANNUAL') value = plan.priceSemiannual || plan.price * 6;
        if (interval === 'YEARLY') value = plan.priceYearly || plan.price * 12;

        let result;

        switch (gateway) {
            case 'asaas': {
                if (!tenant.cpfCnpj || tenant.cpfCnpj.trim() === '') {
                    return NextResponse.json({
                        success: true,
                        checkoutUrl: `/checkout/complete-profile?callbackUrl=${encodeURIComponent(`/api/checkout/portal?planId=${plan.id}&interval=${interval}&gateway=${gateway}`)}`
                    });
                }

                // 1. Cancel existing subscription in Asaas to prevent duplicate charges if user retries checkout
                const existingSub = await prisma.subscription.findUnique({ where: { tenantId } });
                if (existingSub?.externalId && existingSub.gateway === 'asaas') {
                    await AsaasService.cancelSubscription(existingSub.externalId).catch(console.error);
                }

                // 2. Clear any old PENDING local payments so they don't clutter the "Minhas Faturas" dashboard
                await prisma.payment.deleteMany({
                    where: { tenantId, status: 'PENDING' }
                });

                const customer = await AsaasService.createCustomer({
                    name: tenant.name || 'Cliente',
                    email: tenant.email,
                    cpfCnpj: tenant.cpfCnpj,
                });
                result = await AsaasService.createSubscription(customer.id, planId, value, interval, plan.trialDays || 0);


                // Save subscription record
                await prisma.subscription.upsert({
                    where: { tenantId },
                    update: {
                        planId: plan.id,
                        status: 'PENDING',
                        gateway: 'asaas',
                        externalId: result.id,
                    },
                    create: {
                        tenantId,
                        planId: plan.id,
                        status: 'PENDING',
                        gateway: 'asaas',
                        externalId: result.id,
                    },
                });

                if (result.paymentId) {
                    await prisma.payment.upsert({
                        where: { externalId: result.paymentId },
                        update: {
                            amount: result.amount || value,
                            status: 'PENDING',
                            invoiceUrl: result.invoiceUrl,
                        },
                        create: {
                            amount: result.amount || value,
                            status: 'PENDING',
                            gateway: 'asaas',
                            externalId: result.paymentId,
                            invoiceUrl: result.invoiceUrl,
                            tenantId: tenantId,
                        }
                    });
                }
                break;
            }
            case 'mercadopago': {
                const mpPref = await MercadoPagoService.createPreference(tenant, plan.id); // Pass string ID
                result = { invoiceUrl: mpPref.url };

                await prisma.subscription.upsert({
                    where: { tenantId },
                    update: {
                        planId: plan.id,
                        status: 'PENDING',
                        gateway: 'mercadopago',
                        externalId: mpPref.id,
                    },
                    create: {
                        tenantId,
                        planId: plan.id,
                        status: 'PENDING',
                        gateway: 'mercadopago',
                        externalId: mpPref.id,
                    },
                });
                break;
            }
            default:
                return NextResponse.json({ error: 'Gateway inválido' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            checkoutUrl: result.invoiceUrl,
        });

    } catch (error) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: 'Falha no checkout' }, { status: 500 });
    }
}
