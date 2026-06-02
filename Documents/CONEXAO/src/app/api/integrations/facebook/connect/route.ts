import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || "";
    
    const stateObj = {
        tenantEmail: session.user.email,
        targetClientId: clientId
    };
    const state = Buffer.from(JSON.stringify(stateObj)).toString("base64");

    const globalConfig = await prisma.globalConfig.findFirst();
    if (!globalConfig?.metaAppId) {
        return NextResponse.redirect(new URL(`/dashboard/marketing?error=meta_not_configured`, req.url));
    }

    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/integrations/facebook/callback`;
    
    // Scopes for ads and pages and instagram
    const scope = [
        "ads_management",
        "ads_read",
        "business_management",
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "instagram_basic",
        "instagram_content_publish",
        "public_profile"
    ].join(",");

    const fbUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${globalConfig.metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;

    return NextResponse.redirect(fbUrl);
}
