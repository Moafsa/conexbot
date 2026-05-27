export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: any }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const pipelineId = searchParams.get('pipelineId');

        const whereCondition: any = { botId: id };

        // Resolve which pipelineId to use:
        // - If explicitly provided in the query, use it.
        // - If not, auto-detect the bot's first pipeline (new bots always have a pipeline).
        // - If no pipeline exists at all, fall back to null (legacy bots whose stages predate pipelines).
        let resolvedPipelineId: string | null = pipelineId;
        if (!pipelineId) {
            const firstPipeline = await prisma.crmPipeline.findFirst({
                where: { botId: id },
                orderBy: { createdAt: 'asc' },
                select: { id: true },
            });
            resolvedPipelineId = firstPipeline?.id ?? null;
        }
        whereCondition.pipelineId = resolvedPipelineId;

        let stages = await prisma.crmStage.findMany({
            where: whereCondition,
            orderBy: { order: 'asc' }
        });

        // If we found a pipeline but no stages yet, check if there are orphan stages (pipelineId = null)
        // and adopt them into this pipeline before auto-creating defaults.
        if (stages.length === 0 && resolvedPipelineId) {
            const orphans = await prisma.crmStage.findMany({ where: { botId: id, pipelineId: null } });
            if (orphans.length > 0) {
                await prisma.crmStage.updateMany({
                    where: { botId: id, pipelineId: null },
                    data: { pipelineId: resolvedPipelineId },
                });
                stages = await prisma.crmStage.findMany({ where: whereCondition, orderBy: { order: 'asc' } });
            }
        }

        // Se não existirem etapas para o pipeline resolvido, criar etapas padrão
        if (stages.length === 0 && resolvedPipelineId) {
            console.log(`[API /bots/${id}/crm/stages] No stages found for pipeline ${resolvedPipelineId}, creating defaults.`);
            const defaultStages = [
                { botId: id, pipelineId: resolvedPipelineId, name: 'NOVO', color: 'blue', order: 0, description: 'Leads recentes' },
                { botId: id, pipelineId: resolvedPipelineId, name: 'EM ATENDIMENTO', color: 'amber', order: 1, description: 'Leads em conversação' },
                { botId: id, pipelineId: resolvedPipelineId, name: 'APRESENTAÇÃO', color: 'purple', order: 2, description: 'Proposta enviada' },
                { botId: id, pipelineId: resolvedPipelineId, name: 'NEGOCIAÇÃO', color: 'pink', order: 3, description: 'Ajustes finos' },
                { botId: id, pipelineId: resolvedPipelineId, name: 'GANHO', color: 'emerald', order: 4, description: 'Venda concluída' },
            ];

            await prisma.crmStage.createMany({
                data: defaultStages,
                skipDuplicates: true
            });

            stages = await prisma.crmStage.findMany({
                where: whereCondition,
                orderBy: { order: 'asc' }
            });
        }

        // Return stages with _pipelineId metadata so the frontend can track which pipeline is active
        return NextResponse.json(stages, {
            headers: { 'x-pipeline-id': resolvedPipelineId ?? '' }
        });
    } catch (error) {
        console.error('[API /bots/[id]/crm/stages GET] Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: any }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name, color, order, description, pipelineId } = await req.json();

        const stage = await prisma.crmStage.create({
            data: {
                botId: id,
                pipelineId: pipelineId || null,
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
