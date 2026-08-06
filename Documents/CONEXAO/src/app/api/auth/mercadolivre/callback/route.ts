import { NextResponse } from "next/server";
import { MercadoLivreService } from "@/services/mercadolivre/service";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Composite or single tenantId

    if (!code || !state) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=ml_auth_failed`);
    }

    // Parse composite state: tenantId__accountId__shopUrl__wpRedirectUri or tenantId__shopUrl__wpRedirectUri
    const parts = state.split("__");
    const tenantId = parts[0];
    let accountId: string | null = null;
    let shopUrl: string | null = null;
    let wpRedirectUri: string | null = null;

    if (parts.length === 4) {
        accountId = parts[1];
        shopUrl = decodeURIComponent(parts[2]);
        wpRedirectUri = decodeURIComponent(parts[3]);
    } else {
        shopUrl = parts.length > 1 ? decodeURIComponent(parts[1]) : null;
        wpRedirectUri = parts.length > 2 ? decodeURIComponent(parts[2]) : null;
    }

    try {
        // Exchange code and save tokens in Tenant database
        const callbackData = await MercadoLivreService.handleCallback(code, tenantId);
        
        // Fetch tenant details to get their name or username
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });
        const nickname = (tenant as any)?.mlUserId ? `Mercado Livre (${(tenant as any).mlUserId})` : "Mercado Livre";

        if (wpRedirectUri) {
            const finalWpUrl = new URL(wpRedirectUri);

            // If accountId is present, this is Step 2: Connect ML Account!
            if (accountId && accountId !== "0") {
                finalWpUrl.searchParams.set("action", "saas_ml_callback");
                finalWpUrl.searchParams.set("account_id", accountId);
                finalWpUrl.searchParams.set("access_token", callbackData.access_token);
                finalWpUrl.searchParams.set("refresh_token", callbackData.refresh_token);
                finalWpUrl.searchParams.set("expires_in", String(callbackData.expires_in));
                finalWpUrl.searchParams.set("ml_user_id", String(callbackData.user_id));
                finalWpUrl.searchParams.set("account_name", `ML Conta (${callbackData.user_id})`);
            } else {
                // Otherwise, this is Step 1 (or backward-compatible flow)
                let bot = await prisma.bot.findFirst({
                    where: { tenantId: tenantId }
                });

                if (!bot) {
                    bot = await prisma.bot.create({
                        data: {
                            name: `Agente ${nickname}`,
                            businessType: "COMMERCIAL",
                            tenantId: tenantId,
                        }
                    });
                }

                finalWpUrl.searchParams.set("bot_id", bot.id);
                finalWpUrl.searchParams.set("license_key", tenantId);
                finalWpUrl.searchParams.set("account_name", nickname);
                finalWpUrl.searchParams.set("saas_url", `${process.env.NEXT_PUBLIC_APP_URL}`);
                // This same OAuth round-trip already produced a real Mercado Livre token — hand it
                // back too, so the "1-click" flow both validates the license AND connects a real
                // account in a single pass, instead of requiring a second manual step in WordPress.
                finalWpUrl.searchParams.set("access_token", callbackData.access_token);
                finalWpUrl.searchParams.set("refresh_token", callbackData.refresh_token);
                finalWpUrl.searchParams.set("expires_in", String(callbackData.expires_in));
                finalWpUrl.searchParams.set("ml_user_id", String(callbackData.user_id));
            }

            return NextResponse.redirect(finalWpUrl.toString());
        }

        // Direct Dashboard settings flow
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=ml_connected`);
    } catch (error: any) {
        console.error("[ML Callback] Error:", error);
        if (wpRedirectUri) {
            const finalWpUrl = new URL(wpRedirectUri);
            finalWpUrl.searchParams.set("oauth_error", "Falha na autenticação com o Mercado Livre central.");
            return NextResponse.redirect(finalWpUrl.toString());
        }
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=ml_auth_error`);
    }
}
