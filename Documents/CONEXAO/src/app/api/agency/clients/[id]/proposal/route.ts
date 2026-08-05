import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function requireAgencyClient(clientId: string) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
        return { ok: false as const, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
    }

    const agency = await prisma.agency.findUnique({ where: { tenantId: session.user.id } });
    if (!agency) {
        return { ok: false as const, error: NextResponse.json({ error: 'Apenas agências podem gerar propostas.' }, { status: 403 }) };
    }

    const client = await prisma.tenant.findFirst({ where: { id: clientId, agencyId: agency.id } });
    if (!client) {
        return { ok: false as const, error: NextResponse.json({ error: 'Cliente não encontrado ou não pertence a esta agência.' }, { status: 404 }) };
    }

    return { ok: true as const, agency, client };
}

// Lista as propostas já geradas para este cliente (mais recente primeiro)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = await params;
    const auth = await requireAgencyClient(clientId);
    if (!auth.ok) return auth.error;

    const proposals = await prisma.clientProposal.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(proposals);
}

// Cria um novo rascunho de proposta, pré-preenchido a partir do proposalDraft de um Raio-X
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: clientId } = await params;
        const auth = await requireAgencyClient(clientId);
        if (!auth.ok) return auth.error;
        const { agency, client } = auth;

        const body = await req.json().catch(() => ({}));
        const { auditId } = body;

        let audit = null;
        if (auditId) {
            audit = await prisma.clientAudit.findFirst({ where: { id: auditId, clientId } });
        }
        if (!audit) {
            audit = await prisma.clientAudit.findFirst({ where: { clientId }, orderBy: { createdAt: 'desc' } });
        }

        const draft = (audit?.proposalDraft as any) || {};
        const services = Array.isArray(draft.suggestedServices)
            ? draft.suggestedServices.map((s: any) => ({
                  name: s.name || 'Serviço',
                  description: s.description || '',
                  recurring: !!s.recurring,
                  setupPrice: null,
                  monthlyPrice: null
              }))
            : [];

        const proposal = await prisma.clientProposal.create({
            data: {
                clientId,
                agencyId: agency.id,
                auditId: audit?.id || null,
                title: `Proposta Comercial — ${client.name || 'Cliente'}`,
                diagnosis: draft.diagnosis || { workingWell: [], losingReach: [] },
                deliverables: draft.deliverables || [],
                services,
                timeline: draft.timeline || [],
                nextSteps: draft.nextSteps || []
            }
        });

        return NextResponse.json(proposal);
    } catch (error: any) {
        console.error('[Proposal] Erro ao criar proposta:', error);
        return NextResponse.json({ error: 'Erro ao gerar a proposta.', details: error.message }, { status: 500 });
    }
}
