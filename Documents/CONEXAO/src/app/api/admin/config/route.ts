import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const config = await prisma.globalConfig.findUnique({
            where: { id: 'system' }
        });

        if (!config) {
            // Create default if not exists
            const newConfig = await prisma.globalConfig.create({
                data: { id: 'system', systemName: 'ConextBot' }
            });
            return NextResponse.json(newConfig);
        }

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: 'Falha ao buscar configurações' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json();

        const config = await prisma.globalConfig.upsert({
            where: { id: 'system' },
            update: {
                systemName: body.systemName,
                maintenanceMode: body.maintenanceMode,
                googleClientId: body.googleClientId,
                googleClientSecret: body.googleClientSecret,
                openaiApiKey: body.openaiApiKey,
                geminiApiKey: body.geminiApiKey,
                asaasApiKey: body.asaasApiKey,
                elevenLabsApiKey: body.elevenLabsApiKey,
            },
            create: {
                id: 'system',
                systemName: body.systemName,
                maintenanceMode: body.maintenanceMode,
                googleClientId: body.googleClientId,
                googleClientSecret: body.googleClientSecret,
                openaiApiKey: body.openaiApiKey,
                geminiApiKey: body.geminiApiKey,
                asaasApiKey: body.asaasApiKey,
                elevenLabsApiKey: body.elevenLabsApiKey,
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: 'Falha ao salvar configurações' }, { status: 500 });
    }
}
