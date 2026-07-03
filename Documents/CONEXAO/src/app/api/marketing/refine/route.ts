import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAiClient } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { caption, tone = "Profissional" } = body;

        if (!caption) {
            return NextResponse.json({ error: "Legenda é obrigatória" }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: userId },
            select: { openaiApiKey: true, geminiApiKey: true, openrouterApiKey: true, anthropicApiKey: true }
        });

        if (!tenant) throw new Error("Tenant não encontrado");

        const { client } = await getAiClient({ provider: "openai", tenant });

        const prompt = `Você é um copywriter de redes sociais sênior. 
Melhore a seguinte legenda de post de rede social para torná-la mais engajadora, persuasiva e alinhada ao tom de voz "${tone}".
Mantenha a mensagem central intacta. Adicione emojis de forma equilibrada e quebras de linha para legibilidade.
MANDATÓRIO: Retorne APENAS o texto da nova legenda melhorada, sem explicações, introduções ou markdown wraps.

Legenda original:
${caption}`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        const refinedCaption = completion.choices[0].message.content || caption;

        return NextResponse.json({ refinedCaption: refinedCaption.trim() });
    } catch (error: any) {
        console.error("[API_MARKETING_REFINE] Error:", error);
        return NextResponse.json({ error: error.message || "Erro ao melhorar legenda" }, { status: 500 });
    }
}
