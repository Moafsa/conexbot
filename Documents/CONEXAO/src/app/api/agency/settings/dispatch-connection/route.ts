import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.user.id;
        
        // Find or create the system dispatch bot for this agency
        let bot = await prisma.bot.findFirst({
            where: { tenantId, businessType: 'SYSTEM_DISPATCH' }
        });

        if (!bot) {
            bot = await prisma.bot.create({
                data: {
                    name: "Canal de Disparo (Agência)",
                    businessType: "SYSTEM_DISPATCH",
                    tenantId,
                    status: "active",
                }
            });
        }

        return NextResponse.json(bot);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
