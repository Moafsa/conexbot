import { NextResponse } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { email: session.user.email },
            select: {
                googleAdsDeveloperToken: true,
                googleAdsCustomerId: true,
                semrushApiKey: true,
                dataForSeoApiKey: true,
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
        const body = await req.json();
        const { googleAdsDeveloperToken, googleAdsCustomerId, semrushApiKey, dataForSeoApiKey } = body;

        await prisma.tenant.update({
            where: { email: session.user.email },
            data: {
                googleAdsDeveloperToken,
                googleAdsCustomerId,
                semrushApiKey,
                dataForSeoApiKey
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
