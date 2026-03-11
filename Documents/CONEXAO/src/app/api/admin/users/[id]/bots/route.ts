import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// List all bots for a specific user (tenant)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { id } = await params;
        const bots = await prisma.bot.findMany({
            where: { tenantId: id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(bots);
    } catch (error) {
        console.error('Error fetching user bots:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// Update a specific bot for a user (tenant)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { botId, ...updateData } = body;

        if (!botId) {
            return new NextResponse('Bot ID is required', { status: 400 });
        }

        const bot = await prisma.bot.update({
            where: { 
                id: botId,
                tenantId: id // Security check: ensure bot belongs to tenant
            },
            data: updateData
        });

        return NextResponse.json(bot);
    } catch (error) {
        console.error('Error updating user bot:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
