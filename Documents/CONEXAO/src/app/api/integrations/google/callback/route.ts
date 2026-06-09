import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { google } from "googleapis";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(new URL(`/dashboard/marketing?error=google_auth_failed`, req.url));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL(`/dashboard/marketing?error=invalid_request`, req.url));
    }

    let stateObj;
    try {
        stateObj = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
    } catch (e) {
        return NextResponse.redirect(new URL(`/dashboard/marketing?error=invalid_state`, req.url));
    }

    const tenantEmail = stateObj.tenantEmail;
    if (!tenantEmail) {
        return NextResponse.redirect(new URL(`/dashboard/marketing?error=unauthorized`, req.url));
    }

    const tenant = await prisma.tenant.findUnique({
        where: { email: tenantEmail }
    });

    if (!tenant) {
        return NextResponse.redirect(new URL(`/dashboard/marketing?error=tenant_not_found`, req.url));
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

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        if (tokens.refresh_token) {
            await prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                    googleAdsRefreshToken: tokens.refresh_token
                }
            });
        }

        return NextResponse.redirect(new URL(`/dashboard/marketing?success=google_connected`, req.url));
    } catch (err) {
        console.error("[Google Auth Callback] Error exchanging code:", err);
        return NextResponse.redirect(new URL(`/dashboard/marketing?error=google_auth_exchange_failed`, req.url));
    }
}
