export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const tenantId = await getEffectiveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const order = await prisma.order.findFirst({
        where: { id, bot: { tenantId } },
        include: { items: true },
    });
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    const updateData: any = {};
    if (body.address !== undefined) updateData.address = body.address;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.status !== undefined) updateData.status = body.status;

    // Recalculate total if items provided
    if (Array.isArray(body.items) && body.items.length > 0) {
        const total = (body.items as Array<{ quantity: number; unitPrice: number }>)
            .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        updateData.totalAmount = total;

        await prisma.orderItem.deleteMany({ where: { orderId: id } });
        await prisma.orderItem.createMany({
            data: body.items.map((i: { productId: string; quantity: number; unitPrice: number }) => ({
                orderId: id,
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            })),
        });
    }

    const updated = await prisma.order.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, order: updated });
}
