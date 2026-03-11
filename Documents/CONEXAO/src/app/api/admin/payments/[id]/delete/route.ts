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
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

        if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });

        if (payment.externalId) {
            const isSub = payment.externalId.startsWith('sub_');
            if (isSub) {
                await AsaasService.cancelSubscription(payment.externalId);
            } else {
                await AsaasService.cancelPayment(payment.externalId);
            }
        }

        await prisma.payment.delete({ where: { id: payment.id } });

        return NextResponse.json({ success: true, message: 'Fatura excluída com sucesso' });
    } catch (error: any) {
        console.error('[Admin Payment Delete API] Error:', error);
        return NextResponse.json({ error: 'Falha ao excluir a fatura' }, { status: 500 });
    }
}
