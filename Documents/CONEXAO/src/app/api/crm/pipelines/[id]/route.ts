export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

export async function PUT(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        const tenantId = await getEffectiveTenantId(clientId);
        
        if (!tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, allowedAgents } = body;

        // Verify pipeline belongs to bot of tenant
        const pipeline = await prisma.crmPipeline.findFirst({
            where: { id, bot: { tenantId } }
        });

        if (!pipeline) {
            return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
        }

        const updated = await prisma.crmPipeline.update({
            where: { id },
            data: {
                name: name || undefined,
                allowedAgents: allowedAgents || undefined
            },
            include: {
                stages: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('[API /api/crm/pipelines/[id] PUT] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        const tenantId = await getEffectiveTenantId(clientId);
        
        if (!tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify pipeline belongs to bot of tenant
        const pipeline = await prisma.crmPipeline.findFirst({
            where: { id, bot: { tenantId } }
        });

        if (!pipeline) {
            return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
        }

        await prisma.crmPipeline.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API /api/crm/pipelines/[id] DELETE] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
