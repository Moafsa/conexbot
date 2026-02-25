import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { email: session.user.email },
            select: { asaasApiKey: true },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            configured: !!tenant.asaasApiKey,
            // Never send the actual key to frontend
        });
    } catch (error) {
        console.error('API /settings/asaas GET error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { apiKey } = body;

        if (!apiKey || typeof apiKey !== 'string') {
            return NextResponse.json(
                { error: 'apiKey é obrigatória' },
                { status: 400 }
            );
        }

        // Basic validation: Asaas keys start with specific patterns
        if (!apiKey.startsWith('$aact_') && !apiKey.startsWith('$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzY')) {
            return NextResponse.json(
                { error: 'Chave API Asaas inválida' },
                { status: 400 }
            );
        }

        await prisma.tenant.update({
            where: { email: session.user.email },
            data: { asaasApiKey: apiKey },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API /settings/asaas POST error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await prisma.tenant.update({
            where: { email: session.user.email },
            data: { asaasApiKey: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API /settings/asaas DELETE error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
