import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AsaasService } from '@/services/payment/asaas';
import { MercadoPagoService } from '@/services/payment/mercadopago';

const baseUrl = () => process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.conext.click';


export async function GET(req: Request) {
    const safeUrl = baseUrl();
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.redirect(new URL('/auth/login', safeUrl));
        }

        const { searchParams } = new URL(req.url);
        const planId = searchParams.get('planId');
        const interval = searchParams.get('interval') || 'MONTHLY';
        const gateway = searchParams.get('gateway') || 'asaas';
        const tenantId = (session.user as any).id;

        if (!planId) {
            return NextResponse.redirect(new URL('/dashboard/finance', safeUrl));
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        let plan = null;
        try {
            // Try to find by ID (might throw if planId is not a valid UUID format)
            plan = await prisma.plan.findUnique({
                where: { id: planId },
            });
        } catch (e) {
            // Ignore UUID parsing error
        }

        if (!plan) {
            // Fallback to searching by name
            plan = await prisma.plan.findFirst({
                where: { name: { equals: planId, mode: 'insensitive' } }
            });
        }

        if (!tenant || !plan) {
            return NextResponse.redirect(new URL('/dashboard/finance', safeUrl));
        }

        // Prevent API bypass downsells directly on the redirect link
        const activeBotsCount = await prisma.bot.count({
            where: { tenantId }
        });

        if (plan.botLimit > 0 && plan.botLimit < activeBotsCount) {
            return NextResponse.redirect(new URL(`/dashboard/finance?error=downgrade_blocked_bots_active`, safeUrl));
        }

        // Calculate value (duplicated logic for safety in redirection, but could be shared)
        let value = plan.price;
        if (interval === 'QUARTERLY') value = plan.priceQuarterly || plan.price * 3;
        if (interval === 'SEMIANNUAL') value = plan.priceSemiannual || plan.price * 6;
        if (interval === 'YEARLY') value = plan.priceYearly || plan.price * 12;

        switch (gateway) {
            case 'asaas': {
                if (!tenant.cpfCnpj || tenant.cpfCnpj.trim() === '') {
                    return NextResponse.redirect(new URL(`/checkout/complete-profile?callbackUrl=${encodeURIComponent(`/api/checkout/portal?planId=${plan.id}&interval=${interval}&gateway=${gateway}`)}`, safeUrl));
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
                
                const result = await AsaasService.createSubscription(customer.id, plan.id, value, interval, plan.trialDays || 0);

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

                const absoluteUrl = result.invoiceUrl.startsWith('http') 
                    ? result.invoiceUrl 
                    : new URL(result.invoiceUrl, safeUrl).toString();
                
                // Return an HTML page that opens the invoice in a new tab and redirects the main window to the dashboard.
                return new NextResponse(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Redirecionando para o Pagamento...</title>
                        <meta charset="utf-8">
                        <style>
                            body { background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
                            a { color: #6366f1; text-decoration: none; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div>
                            <h2>Processando seu pagamento...</h2>
                            <p>Se a nova aba não abrir automaticamente, <a href="${absoluteUrl}" target="_blank" onclick="window.location.href='/dashboard/finance'">clique aqui para pagar</a>.</p>
                            <script>
                                setTimeout(() => {
                                    window.open("${absoluteUrl}", "_blank");
                                    window.location.href = "/dashboard/finance";
                                }, 500);
                            </script>
                        </div>
                    </body>
                    </html>
                `, {
                    headers: { 'Content-Type': 'text/html' }
                });
            }
            case 'mercadopago': {
                const mpPref = await MercadoPagoService.createPreference(tenant, plan.id);
                
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

                return NextResponse.redirect(mpPref.url);
            }
            default:
                return NextResponse.redirect(new URL('/dashboard/finance?error=invalid_gateway', safeUrl));
        }

    } catch (error) {
        console.error('Checkout Portal Error:', error);
        return NextResponse.redirect(new URL('/dashboard/finance?error=checkout_failed', safeUrl));
    }
}
