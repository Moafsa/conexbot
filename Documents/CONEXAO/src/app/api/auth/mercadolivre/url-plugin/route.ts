import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const shopUrl = searchParams.get("shop_url");
        const wpRedirectUri = searchParams.get("redirect_uri");

        if (!shopUrl || !wpRedirectUri) {
            return NextResponse.json({ error: "shop_url and redirect_uri are required" }, { status: 400 });
        }

        const tenantId = session.user.id;
        const config = await prisma.globalConfig.findUnique({ where: { id: "system" } });
        const clientId = config?.mlClientId;
        
        if (!clientId) {
            return NextResponse.json({ error: "Mercado Livre Client ID not configured in system settings." }, { status: 500 });
        }

        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolivre/callback`;
        // Pass composite state: tenantId__shopUrl__wpRedirectUri
        const state = `${tenantId}__${encodeURIComponent(shopUrl)}__${encodeURIComponent(wpRedirectUri)}`;
        
        const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

        return NextResponse.json({ url });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
