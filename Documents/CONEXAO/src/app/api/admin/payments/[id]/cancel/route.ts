import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AsaasService } from '@/services/payment/asaas';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: paymentId } = await params;

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
        }

        if (payment.status === 'PAID' || payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
            return NextResponse.json({ error: 'Fatura já está paga' }, { status: 400 });
        }

        if (payment.externalId) {
            const isSub = payment.externalId.startsWith('sub_');
            let success = false;
            
            if (isSub) {
                success = await AsaasService.cancelSubscription(payment.externalId);
            } else {
                success = await AsaasService.cancelPayment(payment.externalId);
            }

            if (!success) {
                console.warn(`[Admin] Failed to cancel in Asaas: ${payment.externalId}. Forcing local cancellation.`);
            }
        }

        // Marking as REFUNDED in Prisma since PaymentStatus doesn't have CANCELED, 
        // using REFUNDED to indicate it's written-off/dead.
        await prisma.payment.update({
            where: { id: payment.id },
            data: { 
                status: 'REFUNDED',
                invoiceUrl: null // Limpa link do boleto cancelado 
            }
        });

        return NextResponse.json({ success: true, message: 'Fatura cancelada com sucesso' });
    } catch (error: any) {
        console.error('[Admin Payment Cancel API] Error:', error);
        return NextResponse.json({ error: 'Falha ao cancelar a fatura' }, { status: 500 });
    }
}
