
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

function buildPrompt(caption: string | undefined, conversationContext: string | undefined): string {
    const contextBlock = conversationContext
        ? `\n\n=== CONTEXTO DA CONVERSA (últimas mensagens) ===\n${conversationContext}\n=== FIM DO CONTEXTO ===`
        : '';

    const captionBlock = caption && caption.trim()
        ? `O cliente enviou esta imagem com a legenda: "${caption}".`
        : 'O cliente enviou esta imagem sem legenda.';

    return `Você é um assistente de análise de imagens para atendimento ao cliente via WhatsApp.

${captionBlock}${contextBlock}

Analise a imagem considerando o contexto da conversa e responda de forma objetiva:

1. **O que é a imagem**: descreva o conteúdo principal (ex: comprovante de pagamento, foto de produto, documento, logo, reclamação visual, etc.)
2. **Relevância para o atendimento**: o que o cliente provavelmente está comunicando ou pedindo com esta imagem? Conecte ao contexto da conversa.
3. **Detalhes importantes**: extraia informações específicas relevantes (valores, datas, nomes, endereços, códigos, etc.) se presentes.

Seja direto e útil. Não descreva o que é óbvio — foque no que o agente de atendimento precisa saber para responder adequadamente ao cliente.`;
}

/** Call Gemini generateContent directly - more robust for WhatsApp images */
async function analyzeWithGeminiDirect(apiKey: string, base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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
                generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
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
     * Analyze an image in the context of the conversation.
     * Prefers Gemini for vision. Falls back to OpenAI.
     * @param conversationContext - recent messages formatted as "Cliente: ...\nAssistente: ..."
     */
    async analyze(imagePath: string, caption?: string, bot?: any, conversationContext?: string): Promise<string> {
        const prompt = buildPrompt(caption, conversationContext);

        const runWithOpenAI = async (): Promise<string> => {
            const imageBuffer = fs.readFileSync(imagePath);
            const mimeType = detectImageMimeType(imageBuffer);
            const base64Image = imageBuffer.toString('base64');
            const dataUri = `data:${mimeType};base64,${base64Image}`;

            const { client, model: modelToUse } = await getAiClient({
                provider: 'openai',
                model: 'gpt-4o-mini',
                tenant: bot?.tenant || {}
            });

            const response = await client.chat.completions.create({
                model: modelToUse,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: dataUri, detail: 'high' } },
                    ],
                }],
                max_tokens: 600,
            });

            return response.choices[0]?.message?.content || "Não consegui analisar a imagem.";
        };

        try {
            console.log(`[VisionService] Analyzing ${imagePath} with context (${conversationContext?.length ?? 0} chars)...`);
            const tenant = bot?.tenant || {};
            const geminiKey = tenant.geminiApiKey || process.env.GEMINI_API_KEY;
            const hasOpenAI = !!(tenant.openaiApiKey || process.env.OPENAI_API_KEY);

            const imageBuffer = fs.readFileSync(imagePath);
            const mimeType = detectImageMimeType(imageBuffer);
            const base64Image = imageBuffer.toString('base64');

            // 1. Try Gemini direct API first (best for WhatsApp images)
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
                    return await runWithOpenAI();
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
