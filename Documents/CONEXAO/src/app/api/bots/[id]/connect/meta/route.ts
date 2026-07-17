export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MetaService, MetaApiError } from '@/services/meta/meta-service';
import { logToFile } from '@/services/engine/logger';

async function checkBotOwnership(botId: string, tenantId: string) {
    const bot = await prisma.bot.findUnique({ where: { id: botId, tenantId } });
    return bot !== null;
}

export async function POST(req: Request, { params }: { params: any }) {
    const { id: botId } = await params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;
        if (!(await checkBotOwnership(botId, tenantId))) {
            return NextResponse.json({ error: 'Agente não encontrado ou sem permissão' }, { status: 404 });
        }

        const { code, wabaId: wabaIdFromClient, phoneNumberId: phoneIdFromClient, businessId } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Código de autorização é obrigatório' }, { status: 400 });
        }

        // 1. Troca o código de autorização por um access token de curta duração
        const shortLivedToken = await MetaService.exchangeCodeForToken(code);

        // 2. Converte para token de longa duração (~60 dias) para a conexão não cair sozinha
        const { accessToken, expiresInSeconds } = await MetaService.getLongLivedToken(shortLivedToken);
        const tokenExpiresAt = expiresInSeconds
            ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
            : null;

        // 3. WABA e número de telefone: preferimos os IDs capturados diretamente do evento
        // postMessage do popup (mais confiável e imediato). Se não vierem, caímos no fallback
        // de consultar a API (pode ter atraso de propagação ou ambiguidade com múltiplos negócios).
        let wabaId = wabaIdFromClient;
        let phoneId = phoneIdFromClient;

        if (!wabaId) {
            const wabas = await MetaService.getAvailableWabas(accessToken);
            if (wabas.length === 0) {
                return NextResponse.json({ error: 'Nenhuma conta de WhatsApp Business encontrada para este login.' }, { status: 404 });
            }
            wabaId = wabas[0].id;
        }

        if (!phoneId) {
            const phones = await MetaService.getWabaPhoneNumbers(wabaId, accessToken);
            if (phones.length === 0) {
                return NextResponse.json({ error: 'Nenhum número de telefone encontrado nesta conta WhatsApp Business.' }, { status: 404 });
            }
            phoneId = phones[0].id;
        }

        // 4. Detalhes do número (nome verificado, número visível)
        const phoneDetails = await MetaService.getPhoneNumberDetails(phoneId, accessToken);
        const displayNumber = phoneDetails.display_phone_number;
        const verifiedName = phoneDetails.verified_name;

        // 5. Registra o número na Cloud API (obrigatório para poder enviar/receber mensagens).
        // Gera um PIN automático de 2FA — nenhuma ação manual é exigida do cliente.
        const pin = MetaService.generatePin();
        try {
            await MetaService.registerPhoneNumber(phoneId, accessToken, pin);
        } catch (e: any) {
            // Se o número já estiver registrado (comum em reconexões), a Meta retorna erro —
            // isso não é fatal, seguimos o fluxo normalmente.
            logToFile(`[Meta Connect] registerPhoneNumber aviso (pode já estar registrado): ${e.message}`);
        }

        // 6. Assina o nosso App nos eventos da WABA do cliente — sem isso o webhook nunca recebe nada.
        await MetaService.subscribeAppToWaba(wabaId, accessToken);

        // 7. Persiste no BotChannel
        const existingChannel = await prisma.botChannel.findFirst({
            where: { botId, provider: 'META_WHATSAPP' },
        });

        const channelData = {
            botId,
            provider: 'META_WHATSAPP',
            identifier: phoneId,
            status: 'CONNECTED',
            credentials: {
                accessToken,
                tokenExpiresAt,
                wabaId,
                businessId: businessId || null,
                displayNumber,
                verifiedName,
                pin,
                connectedAt: new Date().toISOString(),
            },
        };

        if (existingChannel) {
            await prisma.botChannel.update({ where: { id: existingChannel.id }, data: channelData });
        } else {
            await prisma.botChannel.create({ data: channelData });
        }

        logToFile(`[Meta Connect] Bot ${botId} conectado ao número oficial ${displayNumber} (waba=${wabaId})`);

        return NextResponse.json({ success: true, displayNumber, verifiedName, wabaId, phoneId });

    } catch (error: any) {
        const isMetaError = error instanceof MetaApiError;
        console.error('[Meta Connect API] Error:', error.message);
        logToFile(`[Meta Connect] Erro bot=${botId}: ${error.message}`);
        return NextResponse.json(
            { error: error.message || 'Falha ao conectar o WhatsApp oficial.', metaCode: isMetaError ? error.code : undefined },
            { status: 500 }
        );
    }
}
