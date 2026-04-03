import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const tenantId = (session?.user as { id?: string } | undefined)?.id;
        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pausedUntil } = await req.json();
        const { id: conversationId } = await params;

        const owned = await prisma.conversation.findFirst({
            where: { id: conversationId, bot: { tenantId } },
            select: { id: true },
        });
        if (!owned) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: { pausedUntil: pausedUntil ? new Date(pausedUntil) : null },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('[API] Error updating conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
