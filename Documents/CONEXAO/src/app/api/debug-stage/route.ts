import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const id = 'cm79k7o3t000j11h682q60t3t'; // Example bot ID
        console.log('[DEBUG API] Starting CrmStage creation for bot', id);

        const stage = await prisma.crmStage.create({
            data: {
                botId: id,
                name: 'DEBUG_STAGE',
                color: '#ff0000',
                order: 99,
                description: 'test'
            }
        });

        return NextResponse.json({ success: true, stage });
    } catch (error: any) {
        console.error('[DEBUG API] Error creating stage:', error);
        return NextResponse.json({
            error: error.message,
            name: error.name,
            code: error.code,
            meta: error.meta
        }, { status: 500 });
    }
}
