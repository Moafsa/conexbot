
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path if necessary
import prisma from '@/lib/prisma'; // Adjust path if necessary

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = (session.user as any).id; // In this app, user ID is tenant ID

        const { searchParams } = new URL(req.url);
        const botId = searchParams.get('botId');
        const search = searchParams.get('search') || '';

        const whereCondition: any = {
            tenantId: tenantId,
            botId: botId || undefined
        };

        if (search) {
            // "Deep Search": Localizar se o thermo existe em alguma mensagem dos contatos deste tenant/bot
            const matchedMessages = await prisma.message.findMany({
                where: {
                    content: { contains: search, mode: 'insensitive' },
                    conversation: { botId: botId || undefined, bot: { tenantId } }
                },
                select: { conversation: { select: { remoteId: true } } }
            });

            // Extrair os telefones/IDs de conversas onde a palavra foi dita
            const matchedPhones = matchedMessages.map(m => m.conversation.remoteId).filter(Boolean);

            whereCondition.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { phone: { in: matchedPhones.length > 0 ? matchedPhones : ['____NO_MATCH____'] } }
            ];
        }

        const contacts = await prisma.contact.findMany({
            where: whereCondition,
            include: {
                stage: true,
                orders: true // Include orders for value calculation
            },
            orderBy: {
                lastActive: 'desc'
            }
        });

        return NextResponse.json(contacts);
    } catch (error) {
        console.error('[API] Error fetching contacts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
