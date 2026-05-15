export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AsaasService } from '@/services/payment/asaas';

export async function POST(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id: paymentId } = await params;
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

        if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });

        if (payment.externalId && payment.externalId.startsWith('pay_')) {
            await AsaasService.receivePaymentInCash(payment.externalId);
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: { 
                status: 'PAID',
                invoiceUrl: null 
            }
        });

        // Instant release: Update subscription status to ACTIVE (Filtered by payment type)
        const subscriptions = await prisma.subscription.findMany({
            where: { tenantId: payment.tenantId, type: payment.type }
        });

        for (const sub of subscriptions) {
            await prisma.subscription.update({
                where: { id: sub.id },
                data: { status: 'ACTIVE' }
            });

            // Gerar chave de licença caso seja plugin e não tenha
            if (sub.type === 'WRITER_PLUGIN') {
                const existingKey = await prisma.licenseKey.findFirst({
                    where: { subscriptionId: sub.id }
                });

                if (!existingKey) {
                    const newKey = `CNX-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                    await prisma.licenseKey.create({
                        data: {
                            key: newKey,
                            subscriptionId: sub.id,
                            status: 'ACTIVE'
                        }
                    });
                }
            }
        }

        // Reset usage counter credits to renew access cycle
        if (payment.type === 'PRIMARY') {
            await prisma.usageCounter.update({
                where: { tenantId: payment.tenantId },
                data: { 
                    messagesUsed: 0,
                    botsUsed: 0,
                    periodStart: new Date(),
                    periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
                }
            });
        }



        return NextResponse.json({ success: true, message: 'Fatura quitada com sucesso' });
    } catch (error: any) {
        console.error('[Admin Payment Pay API] Catch Error:', error);
        return NextResponse.json({ error: 'Falha ao quitar a fatura: ' + error.message }, { status: 500 });
    }
}
