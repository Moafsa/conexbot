import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UzapiService } from "@/services/engine/uzapi";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
        where: { email: session.user.email },
        include: {
            bots: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    sessionName: true,
                }
            }
        }
    });

    if (!tenant) return NextResponse.json([], { status: 404 });

    // Check real status via Uzapi for each bot
    const botsWithStatus = await Promise.all(
        tenant.bots.map(async (bot) => {
            let realStatus = 'DISCONNECTED';
            if (bot.sessionName) {
                realStatus = await UzapiService.getSessionStatus(bot.sessionName);
            }
            return {
                ...bot,
                connectionStatus: realStatus
            };
        })
    );

    return NextResponse.json(botsWithStatus);
}
