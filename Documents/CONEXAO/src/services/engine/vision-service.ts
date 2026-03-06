import { getAiClient } from '@/lib/ai-provider';

export class VisionService {
    static async analyzeImage(params: {
        imageUrl: string;
        prompt: string;
        bot: any;
    }) {
        const { imageUrl, prompt, bot } = params;

        // Determine which provider to use for Vision
        // Priority: OpenAI > Gemini > OpenRouter
        const provider = bot.aiProvider === 'gemini' || bot.aiProvider === 'openai'
            ? bot.aiProvider
            : (bot.tenant.geminiApiKey ? 'gemini' : (bot.tenant.openaiApiKey ? 'openai' : 'openrouter'));

        // OpenAI and OpenRouter use standard OpenAI vision format
        // GeminiWrapper handles the image_url conversion automatically

        const { client, model } = await getAiClient({
            provider,
            model: provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini',
            tenant: bot.tenant
        });

        const messages = [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: { url: imageUrl }
                    }
                ]
            }
        ];

        const completion = await (client as any).chat.completions.create({
            model,
            messages,
            max_tokens: 1000
        });

        return completion.choices[0]?.message?.content || "";
    }
}
