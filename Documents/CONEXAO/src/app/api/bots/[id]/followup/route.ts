import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const rules = await prisma.followupRule.findMany({
            where: { botId: id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(rules);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const userId = (session.user as any).id;
        const body = await req.json();

        const rule = await prisma.followupRule.create({
            data: {
                name: body.name,
                triggerDays: parseInt(body.triggerDays),
                triggerType: body.triggerType,
                message: body.message,
                active: true,
                botId: id,
                tenantId: userId
            }
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error('[API] Error creating rule:', error);
        return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }
}
