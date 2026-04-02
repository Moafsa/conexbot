import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { pausedUntil } = await req.json();
        const conversationId = params.id;

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: { pausedUntil: pausedUntil ? new Date(pausedUntil) : null }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('[API] Error updating conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
