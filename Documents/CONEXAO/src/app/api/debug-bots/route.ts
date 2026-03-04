import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const bots = await prisma.bot.findMany({
            select: { id: true, name: true, sessionName: true }
        });
        return NextResponse.json({ success: true, bots });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
