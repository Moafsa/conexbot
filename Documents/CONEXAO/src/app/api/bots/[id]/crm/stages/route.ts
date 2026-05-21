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
        if (pipelineId) {
            whereCondition.pipelineId = pipelineId;
        } else {
            // Se nenhum pipelineId for especificado, podemos retornar apenas os stages sem pipeline ou criar um pipeline padrão
            whereCondition.pipelineId = null;
        }

        let stages = await prisma.crmStage.findMany({
            where: whereCondition,
            orderBy: { order: 'asc' }
        });

        // Se o pipelineId for especificado e não existirem etapas para ele, criar etapas padrão para esse pipeline
        if (stages.length === 0 && pipelineId) {
            console.log(`[API /bots/${id}/crm/stages] No stages found for pipeline ${pipelineId}, creating defaults.`);
            const defaultStages = [
                { botId: id, pipelineId: pipelineId, name: 'NOVO', color: 'blue', order: 0, description: 'Leads recentes' },
                { botId: id, pipelineId: pipelineId, name: 'EM ATENDIMENTO', color: 'amber', order: 1, description: 'Leads em conversação' },
                { botId: id, pipelineId: pipelineId, name: 'APRESENTAÇÃO', color: 'purple', order: 2, description: 'Proposta enviada' },
                { botId: id, pipelineId: pipelineId, name: 'NEGOCIAÇÃO', color: 'pink', order: 3, description: 'Ajustes finos' },
                { botId: id, pipelineId: pipelineId, name: 'GANHO', color: 'emerald', order: 4, description: 'Venda concluída' },
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

        return NextResponse.json(stages);
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
