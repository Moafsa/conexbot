export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import { getRedis } from '@/lib/redis';

// Canais suportados pelo MessageProcessor — checamos o lock em todos porque
// não sabemos de antemão por qual canal esse contato está conversando agora.
const CHANNELS = ['whatsapp', 'meta_whatsapp', 'generic', 'wordpress', 'instagram', 'simulator'];

/**
 * Verifica se o agente de IA está processando uma mensagem deste contato
 * agora (lock Redis do MessageProcessor). Usado para exibir "digitando..."
 * no CRM em tempo real e provar que a automação é real (não manual).
 */
export async function GET(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        const urlObj = new URL(req.url);
        const clientId = urlObj.searchParams.get('clientId');
        const tenantId = await getEffectiveTenantId(clientId);

        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const contact = await prisma.contact.findFirst({
            where: { id, tenantId },
            select: { phone: true },
        });

        if (!contact) {
            return NextResponse.json({ typing: false });
        }

        const r = getRedis();
        const keys = CHANNELS.map(ch => `lock:${ch}:${contact.phone}`);
        const results = await Promise.all(keys.map(k => r.exists(k).catch(() => 0)));
        const typing = results.some(v => v === 1);

        return NextResponse.json({ typing });
    } catch (error) {
        // Falha ao checar (ex: Redis fora do ar) não deve quebrar o painel — apenas não mostra o indicador.
        return NextResponse.json({ typing: false });
    }
}
