import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function requireAgencyProposal(clientId: string, proposalId: string) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
        return { ok: false as const, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
    }

    const agency = await prisma.agency.findUnique({ where: { tenantId: session.user.id } });
    if (!agency) {
        return { ok: false as const, error: NextResponse.json({ error: 'Apenas agências podem gerenciar propostas.' }, { status: 403 }) };
    }

    const proposal = await prisma.clientProposal.findFirst({
        where: { id: proposalId, clientId, agencyId: agency.id }
    });
    if (!proposal) {
        return { ok: false as const, error: NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 }) };
    }

    return { ok: true as const, agency, proposal };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string; proposalId: string }> }) {
    const { id: clientId, proposalId } = await params;
    const auth = await requireAgencyProposal(clientId, proposalId);
    if (!auth.ok) return auth.error;
    return NextResponse.json(auth.proposal);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; proposalId: string }> }) {
    try {
        const { id: clientId, proposalId } = await params;
        const auth = await requireAgencyProposal(clientId, proposalId);
        if (!auth.ok) return auth.error;

        const body = await req.json();
        const { title, diagnosis, deliverables, services, timeline, nextSteps, status } = body;

        const updated = await prisma.clientProposal.update({
            where: { id: proposalId },
            data: {
                ...(title !== undefined && { title }),
                ...(diagnosis !== undefined && { diagnosis }),
                ...(deliverables !== undefined && { deliverables }),
                ...(services !== undefined && { services }),
                ...(timeline !== undefined && { timeline }),
                ...(nextSteps !== undefined && { nextSteps }),
                ...(status !== undefined && { status })
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('[Proposal] Erro ao atualizar proposta:', error);
        return NextResponse.json({ error: 'Erro ao salvar a proposta.', details: error.message }, { status: 500 });
    }
}
