export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const config = await prisma.globalConfig.findUnique({
            where: { id: 'system' },
            select: { metaAppId: true, metaWhatsappConfigId: true, metaInstagramConfigId: true },
        });
        return NextResponse.json({
            appId: config?.metaAppId || null,
            configId: config?.metaWhatsappConfigId || null,
            instagramConfigId: config?.metaInstagramConfigId || null,
        });
    } catch (error) {
        return NextResponse.json({ appId: null, configId: null, instagramConfigId: null });
    }
}
