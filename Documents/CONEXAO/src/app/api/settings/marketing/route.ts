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
                googleAdsDeveloperToken: true,
                googleAdsCustomerId: true,
                semrushApiKey: true,
                dataForSeoApiKey: true,
                metaAdsToken: true,
                metaAdsAccountId: true,
                metaAdsPixelId: true,
            }
        });

        return NextResponse.json(tenant);
    } catch (error) {
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
        const { googleAdsDeveloperToken, googleAdsCustomerId, semrushApiKey, dataForSeoApiKey, metaAdsToken, metaAdsAccountId, metaAdsPixelId } = body;

        const where = clientId ? { id: clientId } : { email: session.user.email };

        await prisma.tenant.update({
            where,
            data: {
                googleAdsDeveloperToken,
                googleAdsCustomerId,
                semrushApiKey,
                dataForSeoApiKey,
                metaAdsToken,
                metaAdsAccountId,
                metaAdsPixelId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
