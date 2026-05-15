import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MercadoLivreService } from "@/services/mercadolivre/service";

export async function GET() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.user.id;
        const url = await MercadoLivreService.getAuthUrl(tenantId);

        return NextResponse.json({ url });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
