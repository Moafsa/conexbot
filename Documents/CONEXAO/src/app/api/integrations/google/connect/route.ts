import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { google } from "googleapis";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const globalConfig = await prisma.globalConfig.findFirst();
    if (!globalConfig?.googleClientId || !globalConfig?.googleClientSecret) {
        return NextResponse.redirect(new URL(`/dashboard/marketing?error=google_not_configured`, req.url));
    }

    const host = req.headers.get("host") || "app.conext.click";
    const protocol = host.includes("localhost") || host.includes("0.0.0.0") ? "http" : "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${appUrl.includes("0.0.0.0") ? "https://app.conext.click" : appUrl}/api/integrations/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
        globalConfig.googleClientId,
        globalConfig.googleClientSecret,
        redirectUri
    );

    const stateObj = { tenantEmail: session.user.email };
    const state = Buffer.from(JSON.stringify(stateObj)).toString("base64");

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        state: state,
        scope: [
            'https://www.googleapis.com/auth/adwords'
        ]
    });

    return NextResponse.redirect(authUrl);
}
