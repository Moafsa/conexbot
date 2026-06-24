import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAiClient } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";
import { StorageService } from "@/lib/storage";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const tenantId = session.user.id;
        const postId = params.id;

        const post = await prisma.marketingPost.findUnique({
            where: { id: postId, tenantId }
        });

        if (!post) {
            return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
        }

        let parsedContent: any = {};
        try {
            parsedContent = JSON.parse(post.content);
        } catch (e) {
            // Se não for JSON, usamos o texto puro como fallback
            parsedContent = { imagePrompt: post.content };
        }

        const rawPrompt = parsedContent.imagePrompt || parsedContent.caption || "A professional marketing ad";
        const professionalPrompt = `Professional advertising graphic design about: ${rawPrompt}. Use clean, modern layout. Cinematic lighting, high-end commercial photography, 8k. MANDATORY: Write all text on the image in Portuguese (Brazil). Ensure a polished, professional agency-grade finish.`;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { openaiApiKey: true, geminiApiKey: true, openrouterApiKey: true, anthropicApiKey: true }
        });

        if (!tenant) throw new Error("Tenant não encontrado");

        // Usamos a OpenAI porque é onde o proxy mapeia gpt-5.5 para o gerador de imagens
        const { client } = await getAiClient({ provider: "openai", tenant });

        console.log("[GenerateImage] Chamando gpt-5.5 (DALL-E 3 proxy)...");
        
        const response = await (client as any).responses.create({
            model: "gpt-5.5",
            input: [{ role: "user", content: [{ type: "input_text", text: professionalPrompt }] }],
            tools: [{ type: "image_generation", quality: "high", size: "1024x1024" }]
        });

        const imageData = response.output
            .filter((o: any) => o.type === "image_generation_call")
            .map((o: any) => o.result)[0];

        if (!imageData) {
            throw new Error("A IA não retornou os dados da imagem.");
        }

        const imageBuffer = Buffer.from(imageData, 'base64');
        const filename = `marketing/${tenantId}/${Date.now()}-ai-generated.png`;
        
        // Upload para o MinIO
        const imageUrl = await StorageService.uploadFile(imageBuffer, filename, "image/png");

        // Atualiza o post
        const updatedPost = await prisma.marketingPost.update({
            where: { id: postId },
            data: { imageUrl }
        });

        return NextResponse.json({ success: true, post: updatedPost });

    } catch (error: any) {
        console.error("[API_GENERATE_IMAGE] Error:", error);
        return NextResponse.json({ error: error.message || "Erro ao gerar imagem" }, { status: 500 });
    }
}
