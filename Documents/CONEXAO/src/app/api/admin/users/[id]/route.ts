export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AsaasService } from '@/services/payment/asaas';

export async function GET(
    request: Request,
    { params }: { params: any }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const user = await prisma.tenant.findUnique({
            where: { id }
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Error fetching user:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: any }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id } = await params;

        // Sanitize body: remove sensitive or unnecessary fields
        const { confirmPassword, ...updateData } = body;

        // Hash password if it's being updated
        if (updateData.password) {
            const bcrypt = await import('bcryptjs');
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const user = await prisma.tenant.update({
            where: { id },
            data: updateData
        });

        // Se o novo role for AGENCY, garante que existe o registro na tabela Agency
        if (updateData.role === 'AGENCY') {
            const firstTier = await prisma.agencyTier.findFirst({
                orderBy: { minSalesVolume: 'asc' }
            });

            await prisma.agency.upsert({
                where: { tenantId: user.id },
                update: {},
                create: {
                    tenantId: user.id,
                    currentFee: firstTier ? firstTier.feePercentage : 20.0, // Usa a taxa do primeiro tier ou 20% se vazio
                }
            });
        }

        // Hide password in response
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Error updating user:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: any }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const { id: tenantId } = await params;

        // 1. Fetch relations to cleanup in Asaas before deleting from DB
        const [subscriptions, pendingPayments, orders] = await Promise.all([
            prisma.subscription.findMany({ where: { tenantId } }),
            prisma.payment.findMany({ where: { tenantId, status: 'PENDING' } }),
            prisma.order.findMany({ where: { bot: { tenantId }, status: 'PENDING' } })
        ]);

        console.log(`[Admin User Delete] Cleaning up Asaas for tenant ${tenantId}`);

        // 2. Perform Asaas Cleanups (Sequential to avoid hitting rate limits too hard, but still async)
        
        // Cancel Active/Pending Subscriptions
        for (const sub of subscriptions) {
            if (sub.externalId) {
                console.log(`[Admin User Delete] Canceling sub ${sub.externalId}`);
                await AsaasService.cancelSubscription(sub.externalId).catch(err => 
                    console.error(`[Admin User Delete] Error canceling sub ${sub.externalId}:`, err)
                );
            }
        }

        // Cancel Pending Payments (Invoices)
        for (const payment of pendingPayments) {
            if (payment.externalId && !payment.externalId.startsWith('sub_')) {
                console.log(`[Admin User Delete] Canceling payment ${payment.externalId}`);
                await AsaasService.cancelPayment(payment.externalId).catch(err => 
                    console.error(`[Admin User Delete] Error canceling payment ${payment.externalId}:`, err)
                );
            }
        }

        // Cancel Pending Orders (Bot Sales)
        for (const order of orders) {
            if (order.externalId) {
                console.log(`[Admin User Delete] Canceling order payment ${order.externalId}`);
                await AsaasService.cancelPayment(order.externalId).catch(err => 
                    console.error(`[Admin User Delete] Error canceling order ${order.externalId}:`, err)
                );
            }
        }

        // 3. Finally, delete the tenant (relations will cascade delete)
        await prisma.tenant.delete({
            where: { id: tenantId }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting user:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
