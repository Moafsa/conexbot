
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

        const contacts = await prisma.contact.findMany({
            where: {
                tenantId: tenantId
            },
            include: {
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
