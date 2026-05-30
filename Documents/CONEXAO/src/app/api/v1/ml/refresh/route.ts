import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { refresh_token } = body;

        if (!refresh_token) {
            return NextResponse.json({ error: "refresh_token is required" }, { status: 400 });
        }

        // Fetch global credentials
        const config = await prisma.globalConfig.findUnique({ where: { id: "system" } });
        const clientId = config?.mlClientId;
        const clientSecret = config?.mlClientSecret;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: "Mercado Livre credentials are not configured in system settings." }, { status: 500 });
        }

        // Post to Mercado Livre token endpoint
        const response = await fetch("https://api.mercadolibre.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refresh_token
            })
        });

        const data = await response.json();

        if (data.error) {
            return NextResponse.json({ error: data.message || data.error }, { status: 400 });
        }

        return NextResponse.json({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
