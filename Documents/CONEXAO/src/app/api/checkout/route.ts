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

        const { plan, gateway } = parsed.data;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        let result;

        switch (gateway) {
            case 'asaas': {
                const customer = await AsaasService.createCustomer({
                    name: tenant.name || 'Cliente',
                    email: tenant.email,
                    cpfCnpj: tenant.cpfCnpj || '00000000000',
                });
                result = await AsaasService.createSubscription(customer.id, plan);

                // Save subscription record
                await prisma.subscription.upsert({
                    where: { tenantId },
                    update: {
                        plan,
                        status: 'pending',
                        gateway: 'asaas',
                        externalId: result.id,
                    },
                    create: {
                        tenantId,
                        plan,
                        status: 'pending',
                        gateway: 'asaas',
                        externalId: result.id,
                    },
                });
                break;
            }
            case 'mercadopago': {
                const mpPref = await MercadoPagoService.createPreference(tenant, plan);
                result = { invoiceUrl: mpPref.url };

                await prisma.subscription.upsert({
                    where: { tenantId },
                    update: {
                        plan,
                        status: 'pending',
                        gateway: 'mercadopago',
                        externalId: mpPref.id,
                    },
                    create: {
                        tenantId,
                        plan,
                        status: 'pending',
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
