import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // const session = await getServerSession(authOptions);
        // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let stages = await prisma.crmStage.findMany({
            where: { botId: id },
            orderBy: { order: 'asc' }
        });

        if (stages.length === 0) {
            console.log('[API /bots/[id]/crm/stages] No stages found, creating defaults for bot:', id);
            const defaultStages = [
                { botId: id, name: 'NOVO', color: '#3b82f6', order: 0, description: 'Leads recentes' },
                { botId: id, name: 'EM ATENDIMENTO', color: '#f59e0b', order: 1, description: 'Leads em conversação' },
                { botId: id, name: 'APRESENTAÇÃO', color: '#8b5cf6', order: 2, description: 'Proposta enviada' },
                { botId: id, name: 'NEGOCIAÇÃO', color: '#ec4899', order: 3, description: 'Ajustes finos' },
                { botId: id, name: 'GANHO', color: '#10b981', order: 4, description: 'Venda concluída' },
            ];

            try {
                await Promise.all(defaultStages.map(stage => prisma.crmStage.create({ data: stage })));
                console.log('[API /bots/[id]/crm/stages] Default stages created successfully');
            } catch (createError) {
                console.error('[API /bots/[id]/crm/stages] Failed to create default stages:', createError);
                // Return empty array instead of 500 so UI can at least load
                return NextResponse.json([]);
            }

            stages = await prisma.crmStage.findMany({
                where: { botId: id },
                orderBy: { order: 'asc' }
            });
        }

        return NextResponse.json(stages);
    } catch (error) {
        console.error('[API /bots/[id]/crm/stages GET] Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name, color, order, description } = await req.json();

        const stage = await prisma.crmStage.create({
            data: {
                botId: id,
                name,
                color,
                order: order || 0,
                description
            }
        });

        return NextResponse.json(stage);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
