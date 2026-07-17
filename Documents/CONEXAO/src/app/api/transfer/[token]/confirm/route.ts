import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRedis } from '@/lib/redis';

export async function POST(req: Request, { params }: { params: { token: string } }) {
    try {
        const token = params.token;
        if (!token) {
            return NextResponse.json({ error: 'Token não fornecido.' }, { status: 400 });
        }

        const redis = getRedis();
        const key = `transfer_request:${token}`;
        const dataStr = await redis.get(key);

        if (!dataStr) {
            return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 });
        }

        const payload = JSON.parse(dataStr);
        const { clientId, newAgencyId } = payload;

        if (!clientId || !newAgencyId) {
            return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
        }

        // Update the Tenant
        await prisma.tenant.update({
            where: { id: clientId },
            data: { agencyId: newAgencyId },
        });

        // Delete the token so it cannot be used again
        await redis.del(key);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error confirming transfer:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
