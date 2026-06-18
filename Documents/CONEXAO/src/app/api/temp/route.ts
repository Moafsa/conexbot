import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export async function GET() {
  const config = await prisma.globalConfig.upsert({ 
    where: { id: 'system' }, 
    create: { id: 'system', metaAppId: '626656270239248', metaVerifyToken: 'CONEXTBOT_VERIFY_123' },
    update: { metaAppId: '626656270239248', metaVerifyToken: 'CONEXTBOT_VERIFY_123' } 
  });
  return NextResponse.json({ success: true, config });
}
