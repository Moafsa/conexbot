
import fs from 'fs';
import { getAiClient } from '@/lib/ai-provider';

/** Detect image format from magic bytes. Returns format for Gemini/OpenAI. */
function detectImageMimeType(buffer: Buffer): string {
    if (buffer.length < 12) return 'image/jpeg';
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif';
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';
    return 'image/jpeg';
}

/** Call Gemini generateContent directly - more robust for WhatsApp images */
async function analyzeWithGeminiDirect(apiKey: string, base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
    for (const model of models) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { inlineData: { mimeType, data: base64Data } },
                        { text: prompt }
                    ]
                }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 500 }
            })
        });
        if (res.ok) {
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Não consegui analisar a imagem.";
        }
        if (res.status === 404) {
            console.warn(`[VisionService] Gemini model ${model} not found, trying next...`);
            continue;
        }
        const err = await res.text();
        throw new Error(`Gemini vision: ${res.status} - ${err.substring(0, 200)}`);
    }
    throw new Error('No Gemini model available');
}

export const VisionService = {
    /**
     * Analyze an image and return a description.
     * Prefers Gemini for vision (handles WhatsApp images better). Falls back to OpenAI if Gemini unavailable.
     */
    async analyze(imagePath: string, caption?: string, bot?: any): Promise<string> {
        const runAnalysis = async (provider: 'gemini' | 'openai'): Promise<string> => {
            const imageBuffer = fs.readFileSync(imagePath);
            const mimeType = detectImageMimeType(imageBuffer);
            const base64Image = imageBuffer.toString('base64');
            const dataUri = `data:${mimeType};base64,${base64Image}`;
            const textPrompt = caption
                ? `O usuário enviou esta imagem com a legenda: "${caption}". Descreva a imagem em detalhes para que eu possa ajudá-lo.`
                : "Descreva esta imagem em detalhes para que eu possa atender o cliente.";

            const messages: any[] = [
                {
                    role: "user",
                    content: [
                        { type: "text", text: textPrompt },
                        { type: "image_url", image_url: { url: dataUri, detail: "low" } },
                    ],
                },
            ];

            const { client, model: modelToUse } = await getAiClient({
                provider,
                model: provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash',
                tenant: bot?.tenant || {}
            });

            console.log(`[VisionService] Using ${provider} with ${modelToUse}`);

            const response = await client.chat.completions.create({
                model: modelToUse,
                messages,
                max_tokens: 500,
            });

            return response.choices[0]?.message?.content || "Não consegui analisar a imagem.";
        };

        try {
            console.log(`[VisionService] Analyzing ${imagePath}...`);
            const tenant = bot?.tenant || {};
            const geminiKey = tenant.geminiApiKey || process.env.GEMINI_API_KEY;
            const hasOpenAI = !!(tenant.openaiApiKey || process.env.OPENAI_API_KEY);

            const imageBuffer = fs.readFileSync(imagePath);
            const mimeType = detectImageMimeType(imageBuffer);
            const base64Image = imageBuffer.toString('base64');
            const prompt = caption
                ? `O usuário enviou esta imagem com a legenda: "${caption}". Descreva a imagem em detalhes.`
                : "Descreva esta imagem em detalhes para que eu possa atender o cliente.";

            // 1. Try Gemini direct API first (best for WhatsApp/WuzAPI images)
            if (geminiKey) {
                for (const mime of [mimeType, 'image/jpeg', 'image/png']) {
                    try {
                        console.log(`[VisionService] Using Gemini direct API (${mime})`);
                        const result = await analyzeWithGeminiDirect(geminiKey, base64Image, mime, prompt);
                        console.log(`[VisionService] OK (${result.length} chars)`);
                        return result;
                    } catch (err: any) {
                        console.warn(`[VisionService] Gemini (${mime}) failed:`, err?.message?.substring(0, 80));
                    }
                }
            }

            // 2. Fallback to OpenAI
            if (hasOpenAI) {
                try {
                    console.log('[VisionService] Using OpenAI');
                    return await runAnalysis('openai');
                } catch (err: any) {
                    console.error('[VisionService] OpenAI failed:', err?.message);
                }
            }

            throw new Error('No API key (Gemini or OpenAI) configured for vision');
        } catch (error) {
            console.error('[VisionService] Analysis failed:', error);
            return "Ocorreu um erro ao tentar analisar a imagem do usuário.";
        }
    }
};
