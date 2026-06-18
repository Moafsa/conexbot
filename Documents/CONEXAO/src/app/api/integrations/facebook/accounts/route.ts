import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const adAccountId = searchParams.get("adAccountId"); // if provided, fetch pixels for this account

    try {
        const where = clientId ? { id: clientId } : { email: session.user.email };
        const tenant = await prisma.tenant.findUnique({
            where,
            select: { metaAdsToken: true }
        });

        if (!tenant?.metaAdsToken) {
            return NextResponse.json({ error: "Meta Ads Token not found" }, { status: 400 });
        }

        const token = tenant.metaAdsToken;

        if (adAccountId) {
            // Fetch Pixels for a specific Ad Account
            const fbRes = await fetch(`https://graph.facebook.com/v19.0/${adAccountId}/adspixels?fields=id,name&access_token=${token}`);
            const fbData = await fbRes.json();

            if (fbData.error) {
                return NextResponse.json({ error: fbData.error.message }, { status: 400 });
            }

            return NextResponse.json({ pixels: fbData.data || [] });
        } else {
            // Fetch Ad Accounts
            const fbRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,account_status&access_token=${token}`);
            const fbData = await fbRes.json();

            if (fbData.error) {
                return NextResponse.json({ error: fbData.error.message }, { status: 400 });
            }

            return NextResponse.json({ accounts: fbData.data || [] });
        }

    } catch (error) {
        console.error("Facebook Accounts API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
