import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateBase64 = searchParams.get("state");
    const error = searchParams.get("error");
    
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/integrations/facebook/callback`;
    
    let finalRedirect = `${origin}/dashboard/marketing`;

    if (error) {
        return NextResponse.redirect(new URL(`${finalRedirect}?error=${error}`, req.url));
    }

    if (!code || !stateBase64) {
        return NextResponse.redirect(new URL(`${finalRedirect}?error=invalid_request`, req.url));
    }

    try {
        const state = JSON.parse(Buffer.from(stateBase64, "base64").toString("utf-8"));
        
        if (state.targetClientId) {
            finalRedirect = `${origin}/dashboard/marketing?clientId=${state.targetClientId}`;
        }

        const globalConfig = await prisma.globalConfig.findFirst();
        if (!globalConfig?.metaAppId || !globalConfig?.metaAppSecret) {
            return NextResponse.redirect(new URL(`${finalRedirect}?error=server_meta_not_configured`, req.url));
        }

        // Exchange code for token
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${globalConfig.metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${globalConfig.metaAppSecret}&code=${code}`);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("Facebook token error:", tokenData.error);
            return NextResponse.redirect(new URL(`${finalRedirect}?error=token_exchange_failed`, req.url));
        }

        const accessToken = tokenData.access_token;

        // Exchange for long-lived token
        const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${globalConfig.metaAppId}&client_secret=${globalConfig.metaAppSecret}&fb_exchange_token=${accessToken}`);
        const longTokenData = await longTokenRes.json();
        
        const finalToken = longTokenData.access_token || accessToken;

        // Save to target user
        let targetTenantId = null;
        if (state.targetClientId) {
            targetTenantId = state.targetClientId;
        } else if (state.tenantEmail) {
            const tenant = await prisma.tenant.findUnique({ where: { email: state.tenantEmail } });
            if (tenant) targetTenantId = tenant.id;
        }

        if (targetTenantId) {
            await prisma.tenant.update({
                where: { id: targetTenantId },
                data: { metaAdsToken: finalToken }
            });
        }

        return NextResponse.redirect(new URL(`${finalRedirect}?success=facebook_connected`, req.url));
    } catch (err) {
        console.error("OAuth callback error:", err);
        return NextResponse.redirect(new URL(`${finalRedirect}?error=internal_error`, req.url));
    }
}
