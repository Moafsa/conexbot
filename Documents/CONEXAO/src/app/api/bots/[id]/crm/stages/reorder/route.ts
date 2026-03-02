import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { stages } = body;

        if (!Array.isArray(stages)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Batch update all stage orders in a transaction
        const updatePromises = stages.map(stage =>
            prisma.crmStage.update({
                where: { id: stage.id, botId: id },
                data: { order: stage.order }
            })
        );

        await prisma.$transaction(updatePromises);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering stages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
