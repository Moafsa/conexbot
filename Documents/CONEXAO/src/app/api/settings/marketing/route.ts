import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    try {
        const where = clientId ? { id: clientId } : { email: session.user.email };
        const tenant = await prisma.tenant.findUnique({
            where,
            select: {
                googleAdsCustomerId: true,
                ga4MeasurementId: true,
                ga4ApiSecret: true,
                googleAdsRefreshToken: true,
                semrushApiKey: true,
                dataForSeoApiKey: true,
                metaAdsToken: true,
                metaAdsAccountId: true,
                metaAdsPixelId: true,
            }
        });
        
        // Fetch the global config to optionally provide the developer token to the UI if needed
        const globalConfig = await prisma.globalConfig.findUnique({
            where: { id: "system" },
            select: { googleAdsDeveloperToken: true }
        });

        return NextResponse.json({
            ...tenant,
            googleAdsDeveloperToken: globalConfig?.googleAdsDeveloperToken || null
        });
    } catch (error) {
        console.error("GET Marketing Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("clientId");
        const body = await req.json();
        
        // googleAdsDeveloperToken should not be saved in Tenant. It is managed in GlobalConfig (superadmin)
        const { googleAdsCustomerId, ga4MeasurementId, ga4ApiSecret, googleAdsRefreshToken, semrushApiKey, dataForSeoApiKey, metaAdsToken, metaAdsAccountId, metaAdsPixelId } = body;

        const where = clientId ? { id: clientId } : { email: session.user.email };

        await prisma.tenant.update({
            where,
            data: {
                googleAdsCustomerId,
                ga4MeasurementId,
                ga4ApiSecret,
                googleAdsRefreshToken,
                semrushApiKey,
                dataForSeoApiKey,
                metaAdsToken,
                metaAdsAccountId,
                metaAdsPixelId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PUT Marketing Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
