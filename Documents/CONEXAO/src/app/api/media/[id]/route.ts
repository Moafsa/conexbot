
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { KnowledgeService } from '@/services/engine/knowledge';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { extractedText, description } = body;

        const media = await prisma.botMedia.findUnique({
            where: { id },
            include: { bot: true }
        });

        if (!media) {
            return NextResponse.json({ error: 'Mídia não encontrada' }, { status: 404 });
        }

        // Verify ownership
        const tenantId = (session.user as any).id;
        if (media.bot.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const updated = await prisma.botMedia.update({
            where: { id },
            data: {
                extractedText: extractedText !== undefined ? extractedText : undefined,
                description: description !== undefined ? description : undefined,
            }
        });

        // Trigger reindex after fact correction
        await KnowledgeService.reindex(media.botId);

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating media:', error);
        return NextResponse.json({ error: 'Falha ao atualizar mídia' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;

        const media = await prisma.botMedia.findUnique({
            where: { id },
            include: { bot: true }
        });

        if (!media) {
            return NextResponse.json({ error: 'Mídia não encontrada' }, { status: 404 });
        }

        const tenantId = (session.user as any).id;
        if (media.bot.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await prisma.botMedia.delete({ where: { id } });

        // Trigger reindex after removal
        await KnowledgeService.reindex(media.botId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting media:', error);
        return NextResponse.json({ error: 'Falha ao excluir mídia' }, { status: 500 });
    }
}
