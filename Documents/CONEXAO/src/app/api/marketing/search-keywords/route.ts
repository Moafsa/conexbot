import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MarketingIAService } from "@/services/marketing/marketing-ia-service";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { keyword } = body;

        if (!keyword) {
            return NextResponse.json({ error: "Palavra-chave é obrigatória" }, { status: 400 });
        }

        const data = await MarketingIAService.searchKeywords({
            tenantId: session.user.id,
            keyword
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[API_MARKETING_KEYWORDS] Error:", error);
        return NextResponse.json({ error: error.message || "Erro ao pesquisar palavras-chave" }, { status: 500 });
    }
}
