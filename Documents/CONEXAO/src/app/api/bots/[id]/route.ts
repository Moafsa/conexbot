import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateBotSchema } from '@/lib/validations';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const tenantId = (session.user as any).id;

        const bot = await prisma.bot.findFirst({
            where: { id, tenantId },
        });

        if (!bot) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        return NextResponse.json(bot);
    } catch (error) {
        console.error('Error fetching bot:', error);
        return NextResponse.json({ error: 'Falha ao buscar agente' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const tenantId = (session.user as any).id;

        // Verify ownership
        const existing = await prisma.bot.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        const body = await req.json();
        const parsed = updateBotSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const updatedBot = await prisma.bot.update({
            where: { id },
            data: {
                ...parsed.data,
                knowledgeBase: parsed.data.knowledgeBase || undefined,
            },
        });

        // Trigger RAG reindexing (don't await to keep response fast, or await if you want confirmation)
        // Given it involves OpenAI embeddings, we'll do it in background or await if we want to ensure it works.
        // For better UX during "Saving...", we might want to await.
        try {
            const { KnowledgeService } = await import('@/services/engine/knowledge');
            await KnowledgeService.reindex(id);
        } catch (reindexError) {
            console.error('[API /bots/[id] PUT] Reindex failed:', reindexError);
        }

        return NextResponse.json(updatedBot);
    } catch (error) {
        console.error('Error updating bot:', error);
        return NextResponse.json({ error: 'Falha ao atualizar agente' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const tenantId = (session.user as any).id;

        const existing = await prisma.bot.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        await prisma.bot.delete({ where: { id } });

        // Decrement bot counter
        await prisma.usageCounter.updateMany({
            where: { tenantId },
            data: { botsUsed: { decrement: 1 } },
        });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting bot:', error);
        return NextResponse.json({ error: 'Falha ao excluir agente' }, { status: 500 });
    }
}
