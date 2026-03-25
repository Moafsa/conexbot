import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        
        if (!session || userRole !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized. SUPERADMIN only.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        const globalConfig = await prisma.globalConfig.findUnique({
            where: { id: 'system' }
        });

        const tenants = await prisma.tenant.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            } : undefined,
            select: {
                id: true,
                name: true,
                email: true,
                openaiApiKey: true,
                geminiApiKey: true,
                openrouterApiKey: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const results = tenants.map(tenant => {
            const effectiveOpenAI = tenant.openaiApiKey || globalConfig?.openaiApiKey;
            const effectiveGemini = tenant.geminiApiKey || globalConfig?.geminiApiKey;
            const effectiveOpenRouter = tenant.openrouterApiKey || globalConfig?.openrouterApiKey;

            return {
                id: tenant.id,
                name: tenant.name,
                email: tenant.email,
                keys: {
                    hasOwnOpenAI: !!tenant.openaiApiKey,
                    hasOwnGemini: !!tenant.geminiApiKey,
                    hasOwnOpenRouter: !!tenant.openrouterApiKey,
                    effectiveOpenAI: !!effectiveOpenAI,
                    effectiveGemini: !!effectiveGemini,
                    effectiveOpenRouter: !!effectiveOpenRouter
                }
            };
        });

        return NextResponse.json({
            globalKeys: {
                hasOpenAI: !!globalConfig?.openaiApiKey,
                hasGemini: !!globalConfig?.geminiApiKey,
                hasOpenRouter: !!globalConfig?.openrouterApiKey
            },
            tenants: results
        });

    } catch (error: any) {
        console.error('[Admin] Tenant Keys Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
