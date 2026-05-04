import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MetaService } from '@/services/meta/meta-service';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id: botId } = await params;
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Código de autorização é obrigatório' }, { status: 400 });
        }

        // 1. Troca o código pelo token
        const accessToken = await MetaService.exchangeCodeForToken(code);

        // 2. Busca WABAs disponíveis (pegamos a primeira para simplificar)
        const wabas = await MetaService.getAvailableWabas(accessToken);
        if (wabas.length === 0) {
            return NextResponse.json({ error: 'Nenhuma conta de WhatsApp Business encontrada' }, { status: 404 });
        }
        
        const wabaId = wabas[0].id;

        // 3. Busca números de telefone dessa WABA
        const phones = await MetaService.getWabaPhoneNumbers(wabaId, accessToken);
        if (phones.length === 0) {
            return NextResponse.json({ error: 'Nenhum número de telefone encontrado na WABA' }, { status: 404 });
        }

        const phoneId = phones[0].id;
        const displayNumber = phones[0].display_phone_number;

        // 4. Upsert no BotChannel
        const existingChannel = await prisma.botChannel.findFirst({
            where: { botId, provider: 'META_WHATSAPP' }
        });

        const channelData = {
            botId,
            provider: 'META_WHATSAPP',
            identifier: phoneId,
            status: 'CONNECTED',
            credentials: {
                accessToken,
                wabaId,
                displayNumber
            }
        };

        if (existingChannel) {
            await prisma.botChannel.update({
                where: { id: existingChannel.id },
                data: channelData
            });
        } else {
            await prisma.botChannel.create({
                data: channelData
            });
        }

        return NextResponse.json({ success: true, displayNumber });

    } catch (error: any) {
        console.error('[Meta Connect API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
