import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { email: session.user.email },
            select: { notificationPreferences: true },
        });

        let prefs = { email: true, whatsapp: true, marketing: false };
        if (tenant?.notificationPreferences) {
            try {
                prefs = JSON.parse(tenant.notificationPreferences);
            } catch (e) {
                console.error("Error parsing notification preferences:", e);
            }
        }

        return NextResponse.json(prefs);
    } catch (error) {
        console.error("API /settings/notifications error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        // Basic validation
        const prefs = {
            email: !!body.email,
            whatsapp: !!body.whatsapp,
            marketing: !!body.marketing
        };

        await prisma.tenant.update({
            where: { email: session.user.email },
            data: {
                notificationPreferences: JSON.stringify(prefs),
            },
        });

        return NextResponse.json(prefs);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
