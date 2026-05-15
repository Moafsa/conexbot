import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { targetId } = await req.json();
        
        if (!targetId) {
            // Se não passar ID, limpa a personificação
            (await cookies()).delete("impersonate_id");
            return NextResponse.json({ success: true, message: "Impersonation cleared" });
        }

        // Define o cookie de personificação (expira em 2 horas)
        (await cookies()).set("impersonate_id", targetId, {
            maxAge: 60 * 60 * 2,
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        });

        return NextResponse.json({ success: true, targetId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
