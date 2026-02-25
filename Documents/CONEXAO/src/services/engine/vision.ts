
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const VisionService = {
    /**
     * Analyze an image and return a description.
     */
    async analyze(imagePath: string, caption?: string): Promise<string> {
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
                                "detail": "low" // 'low' is cheaper and usually sufficient for context
                            },
                        },
                    ],
                },
            ];

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Supports vision
                messages: messages,
                max_tokens: 300,
            });

            const description = response.choices[0]?.message?.content || "Não consegui analisar a imagem.";
            console.log(`[VisionService] Analysis: "${description.substring(0, 50)}..."`);

            return description;
        } catch (error) {
            console.error('[VisionService] Analysis failed:', error);
            throw error;
        }
    }
};
