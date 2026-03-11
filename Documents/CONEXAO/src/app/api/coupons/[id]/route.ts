import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        // Verify ownership via coupon -> bot -> tenant
        const coupon = await prisma.coupon.findUnique({
            where: { id },
            include: { bot: true }
        });

        if (!coupon || coupon.bot.tenantId !== (session.user as any).id) {
            return NextResponse.json({ error: 'Coupon not found or unauthorized' }, { status: 404 });
        }

        const updated = await prisma.coupon.update({
            where: { id },
            data: {
                code: body.code ? body.code.toUpperCase() : undefined,
                type: body.type,
                value: body.value !== undefined ? parseFloat(body.value) : undefined,
                active: body.active,
                expiresAt: body.expiresAt ? new Date(body.expiresAt) : (body.expiresAt === null ? null : undefined),
                usageLimit: body.usageLimit !== undefined ? (body.usageLimit ? parseInt(body.usageLimit) : null) : undefined,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const coupon = await prisma.coupon.findUnique({
            where: { id },
            include: { bot: true }
        });

        if (!coupon || coupon.bot.tenantId !== (session.user as any).id) {
            return NextResponse.json({ error: 'Coupon not found or unauthorized' }, { status: 404 });
        }

        await prisma.coupon.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
