
import fs from 'fs';
import { getAiClient } from '@/lib/ai-provider';

export const VisionService = {
    /**
     * Analyze an image and return a description.
     */
    async analyze(imagePath: string, caption?: string, bot?: any): Promise<string> {
        try {
            console.log(`[VisionService] Analyzing ${imagePath}...`);

            // Read and convert to base64
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const dataUri = `data:image/jpeg;base64,${base64Image}`;

            const messages: any[] = [
                {
                    role: "user",
                    content: [
                        { type: "text", text: caption ? `O usuário enviou esta imagem com a legenda: "${caption}". Descreva a imagem em detalhes para que eu possa ajudá-lo.` : "Descreva esta imagem em detalhes para que eu possa atender o cliente." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": dataUri,
                                "detail": "low"
                            },
                        },
                    ],
                },
            ];

            // Use the bot's preferred provider or fallback to Gemini for vision (usually cheaper/better for vision)
            const provider = bot?.aiProvider || 'gemini';
            const model = provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash';

            const { client, model: modelToUse } = await getAiClient({
                provider,
                model,
                tenant: bot?.tenant || {}
            });

            console.log(`[VisionService] Using provider ${provider} with model ${modelToUse}`);

            const response = await client.chat.completions.create({
                model: modelToUse,
                messages: messages,
                max_tokens: 500,
            });

            const description = response.choices[0]?.message?.content || "Não consegui analisar a imagem.";
            console.log(`[VisionService] Analysis length: ${description.length} chars`);

            return description;
        } catch (error) {
            console.error('[VisionService] Analysis failed:', error);
            // Fallback for missing keys or errors
            return "Ocorreu um erro ao tentar analisar a imagem do usuário.";
        }
    }
};
