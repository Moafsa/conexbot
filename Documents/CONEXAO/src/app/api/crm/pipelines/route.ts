export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const tenantId = (session?.user as any)?.id;
        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const botId = searchParams.get('botId');
        if (!botId) {
            return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
        }

        const pipelines = await prisma.crmPipeline.findMany({
            where: {
                botId,
                bot: { tenantId }
            },
            include: {
                stages: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json(pipelines);
    } catch (error) {
        console.error('[API /api/crm/pipelines GET] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const tenantId = (session?.user as any)?.id;
        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, botId, allowedAgents } = body;

        if (!name || !botId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify bot belongs to tenant
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId }
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
        }

        const pipeline = await prisma.crmPipeline.create({
            data: {
                name,
                botId,
                allowedAgents: allowedAgents || []
            }
        });

        // Initialize default stages for the new pipeline
        const defaultStages = [
            { botId, pipelineId: pipeline.id, name: 'NOVO', color: 'blue', order: 0, description: 'Leads recentes' },
            { botId, pipelineId: pipeline.id, name: 'EM ATENDIMENTO', color: 'amber', order: 1, description: 'Leads em conversação' },
            { botId, pipelineId: pipeline.id, name: 'APRESENTAÇÃO', color: 'purple', order: 2, description: 'Proposta enviada' },
            { botId, pipelineId: pipeline.id, name: 'NEGOCIAÇÃO', color: 'pink', order: 3, description: 'Ajustes finos' },
            { botId, pipelineId: pipeline.id, name: 'GANHO', color: 'emerald', order: 4, description: 'Venda concluída' },
        ];

        await prisma.crmStage.createMany({
            data: defaultStages
        });

        const fullPipeline = await prisma.crmPipeline.findUnique({
            where: { id: pipeline.id },
            include: {
                stages: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        return NextResponse.json(fullPipeline);
    } catch (error) {
        console.error('[API /api/crm/pipelines POST] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
