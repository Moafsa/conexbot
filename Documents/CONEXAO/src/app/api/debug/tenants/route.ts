import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tenants = await prisma.tenant.findMany({
            select: { id: true, email: true, name: true }
        });
        return NextResponse.json({ count: tenants.length, tenants });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
