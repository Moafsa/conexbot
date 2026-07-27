import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const driver = await prisma.contact.findFirst({
            where: {
                loginToken: token,
                loginTokenExpires: {
                    gt: new Date()
                },
                contactType: 'DRIVER'
            },
            include: {
                assignedOrders: {
                    where: {
                        status: { in: ['PENDING', 'DISPATCHED', 'IN_TRANSIT'] }
                    },
                    include: {
                        contact: true,
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        return NextResponse.json({
            driver: {
                id: driver.id,
                name: driver.name,
                phone: driver.phone,
                activeJobs: driver.activeJobs
            },
            orders: driver.assignedOrders
        });
    } catch (error: any) {
        console.error('[API Driver Me GET Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, orderId, action } = body;

        if (!token || !orderId || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const driver = await prisma.contact.findFirst({
            where: {
                loginToken: token,
                loginTokenExpires: {
                    gt: new Date()
                },
                contactType: 'DRIVER'
            }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                driverId: driver.id
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (action === 'complete') {
            const { paymentMethod } = body;
            const payLabel = paymentMethod || 'A COMBINAR';

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'DELIVERED',
                    updatedAt: new Date()
                }
            });

            if (order.contactId) {
                const prevNotes = order.contact?.notes || '';
                const newNote = `${prevNotes}\n[ENTREGA CONCLUÍDA - PAGAMENTO: ${payLabel}]`.trim();
                await prisma.contact.update({
                    where: { id: order.contactId },
                    data: { notes: newNote }
                });
            }

            const newActiveJobs = Math.max(0, (driver.activeJobs || 1) - 1);
            await prisma.contact.update({
                where: { id: driver.id },
                data: { activeJobs: newActiveJobs }
            });

            return NextResponse.json({ success: true, message: 'Entrega marcada como concluída com sucesso' });
        }

        if (action === 'cancel') {
            const { cancelReason, cancelNote } = body;
            const reasonLabel = cancelReason || 'NÃO ESPECIFICADO';
            const noteText = cancelNote ? ` (${cancelNote})` : '';

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    updatedAt: new Date()
                }
            });

            if (order.contactId) {
                const prevNotes = order.contact?.notes || '';
                const newNote = `${prevNotes}\n[ENTREGA DEVOLVIDA/CANCELADA - MOTIVO: ${reasonLabel}${noteText}]`.trim();
                await prisma.contact.update({
                    where: { id: order.contactId },
                    data: { notes: newNote }
                });
            }

            const newActiveJobs = Math.max(0, (driver.activeJobs || 1) - 1);
            await prisma.contact.update({
                where: { id: driver.id },
                data: { activeJobs: newActiveJobs }
            });

            return NextResponse.json({ success: true, message: 'Entrega cancelada/devolvida com sucesso' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('[API Driver Me POST Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
