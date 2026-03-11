import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { google } from 'googleapis';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const botId = url.searchParams.get('state');

        if (!code || !botId) {
            return NextResponse.json({ error: 'Missing code or state (botId)' }, { status: 400 });
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

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            // Se o Google não retornar um refresh_token, o usuário já havia autorizado antes sem conceder offline access.
            // Para resolver, o admin precisa forçar a re-autorização ou a gente avisa.
            // Mas a gente enviou prompt: 'consent', então deve vir.
        }

        await prisma.bot.update({
            where: { id: botId },
            data: {
                googleRefreshToken: tokens.refresh_token || undefined,
            }
        });

        // Redirect back to dashboard agenda tab
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/bots/${botId}?tab=agenda`);
    } catch (error) {
        console.error('[Google Callback API] Error:', error);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=google_auth_failed`);
    }
}
