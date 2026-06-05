export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("clientId");
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        const botId = searchParams.get('botId');
        if (!botId) {
            return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
        }

        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId }
        });

        if (!bot || !bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId) {
            // Return empty list if Chatwoot is not fully configured
            return NextResponse.json([]);
        }

        const baseUrl = bot.chatwootUrl.replace(/\/$/, '');
        const url = `${baseUrl}/api/v1/accounts/${bot.chatwootAccountId}/agents`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'api_access_token': bot.chatwootToken,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API /api/crm/agents] Chatwoot fetch failed:', response.status, errorText);
            return NextResponse.json({ error: 'Failed to fetch agents from Chatwoot' }, { status: response.status });
        }

        const agents = await response.json();
        return NextResponse.json(agents);
    } catch (error: any) {
        console.error('[API /api/crm/agents] Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
