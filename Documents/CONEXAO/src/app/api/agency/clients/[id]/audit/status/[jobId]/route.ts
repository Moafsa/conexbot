export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string, jobId: string }> }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id: clientId, jobId } = await params;

        // Validar permissão
        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id }
        });
        
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing podem consultar auditorias.' }, { status: 403 });
        }

        // Primeiro verifica se já existe uma auditoria salva com esse ID (o worker usa o jobId como audit.id)
        const audit = await prisma.clientAudit.findUnique({
            where: { id: jobId }
        });

        if (audit) {
            return NextResponse.json({
                status: 'COMPLETED',
                auditId: audit.id,
                scores: audit.scores,
                overallScore: audit.overallScore,
                report: audit.report,
                missions: audit.missions
            });
        }

        // Se não encontrou no banco, verificar status na fila do BullMQ
        const { getAuditQueue } = await import('@/lib/queue');
        const queue = getAuditQueue();
        const job = await queue.getJob(jobId);

        if (!job) {
            // Se não tá no banco e nem na fila
            return NextResponse.json({ status: 'NOT_FOUND', error: 'Job não encontrado.' }, { status: 404 });
        }

        const state = await job.getState();

        if (state === 'failed') {
            return NextResponse.json({ status: 'FAILED', error: job.failedReason || 'Erro desconhecido no processamento' });
        }

        // Pode ser 'waiting', 'active', 'delayed'
        return NextResponse.json({ status: 'PROCESSING', progress: job.progress });

    } catch (error: any) {
        console.error(`[RaioX] Erro ao consultar status da auditoria:`, error);
        return NextResponse.json({ error: 'Erro interno ao consultar status.', details: error.message }, { status: 500 });
    }
}
