export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AsaasService } from '@/services/payment/asaas';
import { MercadoPagoService } from '@/services/payment/mercadopago';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 });
        }

        let agencyTenantId = (session.user as any).id;
        if (!agencyTenantId && session.user.email) {
            const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
            agencyTenantId = t?.id;
        }

        const agency = await prisma.agency.findUnique({ where: { tenantId: agencyTenantId } });
        if (!agency) return NextResponse.json({ error: "Not an agency" }, { status: 403 });

        const clientId = params.id;
        
        // Verify the client belongs to this agency
        const client = await prisma.tenant.findUnique({
            where: { id: clientId }
        });

        if (!client || client.agencyId !== agency.id) {
            return NextResponse.json({ error: 'Cliente não encontrado ou não pertence a sua agência' }, { status: 404 });
        }

        const body = await req.json();
        const { planId, interval = 'MONTHLY', gateway = 'asaas', customValue } = body;

        if (!planId) {
            return NextResponse.json({ error: 'ID do plano é obrigatório' }, { status: 400 });
        }

        // Fetch plan details
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

        let basePrice = plan.price;

        // --- Agency Pricing Override ---
        if (plan.productCatalogId) {
            const agencyPricing = await prisma.agencyPricing.findUnique({
                where: {
                    agencyId_productId: {
                        agencyId: agency.id,
                        productId: plan.productCatalogId
                    }
                }
            });
            if (agencyPricing) {
                basePrice = agencyPricing.monthlyPrice;
            }
        }
        // ------------------------------

        // Use custom value if provided and above minimum
        let value = customValue || basePrice;

        // Simple validation: don't allow price below plan price (to protect platform fees)
        if (customValue && customValue < plan.price) {
            return NextResponse.json({ error: `O valor não pode ser inferior ao mínimo da plataforma (R$ ${plan.price})` }, { status: 400 });
        }

        if (interval === 'QUARTERLY') value = value * 3;
        if (interval === 'SEMIANNUAL') value = value * 6;
        if (interval === 'YEARLY') value = value * 12;
        // if interval is ONCE, value stays value (as a single charge)

        let result;

        switch (gateway) {
            case 'asaas': {
                if (!client.cpfCnpj || client.cpfCnpj.trim() === '' || !client.whatsapp) {
                    return NextResponse.json({
                        error: 'Para gerar faturas do Asaas, o cliente precisa ter CPF/CNPJ e Telefone (WhatsApp) preenchidos no cadastro.'
                    }, { status: 400 });
                }

                // 1. Cancel existing subscription in Asaas to prevent duplicate charges
                const existingSub = await prisma.subscription.findUnique({ 
                    where: { 
                        tenantId_type: { 
                            tenantId: client.id, 
                            type: plan.type 
                        } 
                    } 
                });

                if (existingSub?.externalId && existingSub.gateway === 'asaas') {
                    if (existingSub.planId === plan.id && existingSub.status === 'ACTIVE') {
                         return NextResponse.json({ error: 'Este cliente já possui uma assinatura ativa deste plano.' }, { status: 400 });
                    }
                    await AsaasService.cancelSubscription(existingSub.externalId).catch(console.error);
                }

                // 2. Clear old PENDING local payments
                await prisma.payment.deleteMany({
                    where: { 
                        tenantId: client.id, 
                        status: 'PENDING',
                        type: plan.type
                    }
                });

                const customer = await AsaasService.createCustomer({
                    name: client.name || 'Cliente',
                    email: client.email,
                    cpfCnpj: client.cpfCnpj,
                    phone: client.whatsapp
                });

                // --- Revenue Share Split Logic ---
                const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
                let splits: any[] | undefined = undefined;

                if (globalConfig?.platformAsaasWalletId && agency.currentFee > 0) {
                    splits = [
                        {
                            walletId: globalConfig.platformAsaasWalletId,
                            percentualValue: agency.currentFee
                        }
                    ];
                    console.log(`[Checkout] Applying platform split of ${agency.currentFee}% to wallet ${globalConfig.platformAsaasWalletId}`);
                }
                // ---------------------------------

                if (interval === 'ONCE') {
                    result = await AsaasService.createPaymentLink({
                        apiKey: '', // Use system key
                        customerName: client.name || 'Cliente',
                        customerEmail: client.email,
                        customerPhone: client.whatsapp || '',
                        customerCpfCnpj: client.cpfCnpj,
                        amount: value * 100,
                        description: `Conext Bot - Ativação de Serviço (${plan.name})`,
                        splits: splits
                    });
                } else {
                    result = await AsaasService.createSubscription(customer.id, plan.id, value, interval, plan.trialDays || 0, 0, splits);
                }

                // Save subscription record
                await prisma.subscription.upsert({
                    where: { 
                        tenantId_type: { 
                            tenantId: client.id, 
                            type: plan.type 
                        } 
                    },
                    update: {
                        planId: plan.id,
                        interval: interval as any,
                        status: 'PENDING',
                        gateway: 'asaas',
                        externalId: result.id,
                    },
                    create: {
                        tenantId: client.id,
                        type: plan.type,
                        planId: plan.id,
                        interval: interval as any,
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
                            type: plan.type,
                        },
                        create: {
                            amount: result.amount || value,
                            status: 'PENDING',
                            gateway: 'asaas',
                            externalId: result.paymentId,
                            invoiceUrl: result.invoiceUrl,
                            tenantId: client.id,
                            type: plan.type,
                        }
                    });
                }
                break;
            }
            case 'mercadopago': {
                const mpPref = await MercadoPagoService.createPreference(client, plan.id);
                result = { invoiceUrl: mpPref.url };

                await prisma.subscription.upsert({
                    where: { 
                        tenantId_type: { 
                            tenantId: client.id, 
                            type: plan.type 
                        } 
                    },
                    update: {
                        planId: plan.id,
                        status: 'PENDING',
                        gateway: 'mercadopago',
                        externalId: mpPref.id,
                    },
                    create: {
                        tenantId: client.id,
                        type: plan.type,
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
        console.error('Agency Checkout Error:', error);
        return NextResponse.json({ error: 'Falha ao gerar link de pagamento' }, { status: 500 });
    }
}
