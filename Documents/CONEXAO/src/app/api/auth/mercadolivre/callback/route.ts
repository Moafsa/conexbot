import { NextResponse } from "next/server";
import { MercadoLivreService } from "@/services/mercadolivre/service";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const tenantId = searchParams.get("state"); // We passed tenantId in state

    if (!code || !tenantId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=ml_auth_failed`);
    }

    try {
        await MercadoLivreService.handleCallback(code, tenantId);
        
        // Redirect back to settings with success
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=ml_connected`);
    } catch (error: any) {
        console.error("[ML Callback] Error:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=ml_auth_error`);
    }
}
