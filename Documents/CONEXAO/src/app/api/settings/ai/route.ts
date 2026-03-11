import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateAiSettingsSchema = z.object({
    openaiApiKey: z.string().optional().nullable(),
    geminiApiKey: z.string().optional().nullable(),
    openrouterApiKey: z.string().optional().nullable(),
    elevenLabsApiKey: z.string().optional().nullable(),
});

export async function GET() {
    console.log("[API /settings/ai] GET request received");
    try {
        const session = await getServerSession(authOptions);
        console.log("[API /settings/ai] Session:", session ? "Found" : "Not Found");
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[API /settings/ai] Querying tenant with email:", session.user.email);
        const tenant = await prisma.tenant.findUnique({
            where: { email: session.user.email },
            select: {
                openaiApiKey: true,
                geminiApiKey: true,
                openrouterApiKey: true,
                elevenLabsApiKey: true,
            } as any,
        });

        console.log("[API /settings/ai] Tenant found:", tenant ? "Yes" : "No");
        return NextResponse.json(tenant);
    } catch (error: any) {
        console.error("API /settings/ai GET error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const data = updateAiSettingsSchema.parse(body);

        await prisma.tenant.update({
            where: { email: session.user.email },
            data: {
                openaiApiKey: data.openaiApiKey,
                geminiApiKey: data.geminiApiKey,
                openrouterApiKey: data.openrouterApiKey,
                elevenLabsApiKey: data.elevenLabsApiKey,
            } as any,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("API /settings/ai PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
