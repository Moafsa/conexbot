import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { google } from 'googleapis';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: botId } = await params;

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId: (session.user as any).id },
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
        }

        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        if (!config?.googleClientId || !config?.googleClientSecret) {
            return NextResponse.json({ error: 'Google Calendar API keys not configured by admin' }, { status: 400 });
        }

        const oauth2Client = new google.auth.OAuth2(
            config.googleClientId,
            config.googleClientSecret,
            `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
        );

        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ];

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            // Pass botId in state so we know which bot is connecting
            state: botId 
        });

        return NextResponse.json({ url });
    } catch (error) {
        console.error('[Google Auth API] Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
