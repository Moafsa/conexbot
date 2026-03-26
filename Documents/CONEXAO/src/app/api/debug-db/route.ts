import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const count = await prisma.bot.count();
        const firstBot = await prisma.bot.findFirst({ select: { id: true, name: true } });
        return NextResponse.json({ 
            status: 'ok', 
            count, 
            firstBot,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL
            }
        });
    } catch (error: any) {
        return NextResponse.json({ 
            status: 'error', 
            message: error.message,
            stack: error.stack,
            code: error.code
        }, { status: 500 });
    }
}
