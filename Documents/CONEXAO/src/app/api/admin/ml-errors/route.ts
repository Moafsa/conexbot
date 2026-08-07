export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const showResolved = url.searchParams.get('resolved') === '1';
        const limit = 30;

        const where = { resolved: showResolved };

        const [errors, total] = await Promise.all([
            prisma.mlErrorReport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.mlErrorReport.count({ where }),
        ]);

        const tenantIds = Array.from(new Set(errors.map(e => e.tenantId)));
        const tenants = await prisma.tenant.findMany({
            where: { id: { in: tenantIds } },
            select: { id: true, name: true, email: true },
        });
        const tenantById = new Map(tenants.map(t => [t.id, t]));

        return NextResponse.json({
            errors: errors.map(e => ({ ...e, tenant: tenantById.get(e.tenantId) || null })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const { id, resolved } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        await prisma.mlErrorReport.update({
            where: { id },
            data: { resolved: !!resolved },
        });

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
