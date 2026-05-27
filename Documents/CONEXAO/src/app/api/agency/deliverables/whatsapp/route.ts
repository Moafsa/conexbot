export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UzapiService } from '@/services/engine/uzapi';
import { PhoneUtils } from '@/lib/phone-utils';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        // 1. Obter agência do usuário logado
        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id },
            include: { tenant: true }
        });
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing podem despachar entregáveis.' }, { status: 403 });
        }

        const body = await req.json();
        const { clientId, content } = body;

        if (!clientId || !content) {
            return NextResponse.json({ error: 'Os campos clientId e content são obrigatórios.' }, { status: 400 });
        }

        // 2. Buscar o cliente garantindo que pertence a esta agência
        const client = await prisma.tenant.findFirst({
            where: {
                id: clientId,
                agencyId: agency.id
            }
        });

        if (!client || !client.whatsapp) {
            return NextResponse.json({ error: 'Cliente não encontrado ou número de WhatsApp não configurado.' }, { status: 404 });
        }

        // 3. Localizar bot ativo (conectado) da agência ou sistema para despachar
        const agencyBots = await prisma.bot.findMany({
            where: { tenantId: agency.tenantId }
        });
        
        let dispatchBot = agencyBots.find(b => b.connectionStatus === 'CONNECTED');

        if (!dispatchBot) {
            // Fallback: Buscar qualquer bot conectado do sistema
            const anyConnected = await prisma.bot.findFirst({
                where: { connectionStatus: 'CONNECTED' }
            });
            if (anyConnected) {
                dispatchBot = anyConnected;
            }
        }

        if (!dispatchBot || !dispatchBot.sessionName) {
            return NextResponse.json({ 
                error: 'Nenhum canal de WhatsApp conectado no ConextBot. Por favor, conecte um bot na plataforma antes de enviar entregáveis.' 
            }, { status: 412 });
        }

        const normalizedPhone = PhoneUtils.normalize(client.whatsapp);
        
        // 4. Formatar mensagem executiva elegante
        const formattedMessage = 
            `*RELATÓRIO DE ENTREGA OPERACIONAL* 🚀\n` +
            `_Enviado por: ${agency.tenant.name || 'Sua Agência Partner'}_ \n\n` +
            `Olá, *${client.name}*!\n` +
            `Preparamos novos direcionamentos estratégicos de elite para o crescimento do seu negócio. Veja abaixo:\n\n` +
            `-----------------------------------------\n\n` +
            `${content}\n\n` +
            `-----------------------------------------\n` +
            `💡 _Dúvidas ou ajustes? Fale diretamente com o seu consultor da agência!_`;

        console.log(`[Deliverable] Despachando material para ${normalizedPhone} usando sessão "${dispatchBot.sessionName}"`);

        const sent = await UzapiService.sendMessage(dispatchBot.sessionName, normalizedPhone, formattedMessage);

        if (!sent) {
            return NextResponse.json({ error: 'Falha ao despachar a mensagem via Gateway de WhatsApp. Verifique a conexão do bot.' }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            whatsappSent: true,
            recipient: normalizedPhone
        });

    } catch (error: any) {
        console.error(`[Deliverable] Erro crítico no envio do entregável via WhatsApp:`, error);
        return NextResponse.json({
            error: 'Erro interno ao despachar entregável via WhatsApp.',
            details: error.message
        }, { status: 500 });
    }
}
