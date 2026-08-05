import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateProposalPdf } from '@/services/agency/proposal-pdf-service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string; proposalId: string }> }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { id: clientId, proposalId } = await params;

        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id },
            include: { tenant: true }
        });
        if (!agency) return NextResponse.json({ error: 'Apenas agências podem exportar propostas.' }, { status: 403 });

        const proposal = await prisma.clientProposal.findFirst({
            where: { id: proposalId, clientId, agencyId: agency.id },
            include: { client: true }
        });
        if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 });

        const pdfBuffer = generateProposalPdf({
            title: proposal.title,
            clientName: proposal.client.name || 'Cliente',
            agencyName: agency.tenant?.name || 'Conext',
            createdAt: proposal.createdAt,
            diagnosis: (proposal.diagnosis as any) || {},
            deliverables: (proposal.deliverables as any) || [],
            services: (proposal.services as any) || [],
            timeline: (proposal.timeline as any) || [],
            nextSteps: (proposal.nextSteps as any) || []
        });

        const filename = `Proposta_Comercial_${(proposal.client.name || 'Cliente').replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error: any) {
        console.error('[Proposal PDF] Erro ao gerar PDF:', error);
        return NextResponse.json({ error: 'Erro ao gerar o PDF da proposta.', details: error.message }, { status: 500 });
    }
}
