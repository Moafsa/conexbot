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

    // Parse composite state if present: tenantId__shopUrl__wpRedirectUri
    const parts = state.split("__");
    const tenantId = parts[0];
    const shopUrl = parts.length > 1 ? decodeURIComponent(parts[1]) : null;
    const wpRedirectUri = parts.length > 2 ? decodeURIComponent(parts[2]) : null;

    try {
        // Exchange code and save tokens in Tenant database
        const callbackData = await MercadoLivreService.handleCallback(code, tenantId);
        
        // Fetch tenant details to get their name or username
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });
        const nickname = (tenant as any)?.mlUserId ? `Mercado Livre (${(tenant as any).mlUserId})` : "Mercado Livre";

        if (wpRedirectUri) {
            // WordPress integration flow!
            // 1. Get or create Bot for this tenant
            let bot = await prisma.bot.findFirst({
                where: { tenantId: tenantId }
            });

            if (!bot) {
                // Create a default bot if none exists
                bot = await prisma.bot.create({
                    data: {
                        name: `Agente ${nickname}`,
                        businessType: "COMMERCIAL",
                        tenantId: tenantId,
                    }
                });
            }

            // 2. Redirect back to WooCommerce settings page with Bot ID and License Key
            const finalWpUrl = new URL(wpRedirectUri);
            finalWpUrl.searchParams.set("bot_id", bot.id);
            finalWpUrl.searchParams.set("license_key", tenantId);
            finalWpUrl.searchParams.set("account_name", nickname);
            finalWpUrl.searchParams.set("saas_url", `${process.env.NEXT_PUBLIC_APP_URL}`);

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
