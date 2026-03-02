import OpenAI from 'openai';

// Helper to get AI client and config
export class GeminiWrapper {
    constructor(private apiKey: string) { }
    chat = {
        completions: {
            create: async (body: any) => {
                const model = body.model || 'gemini-1.5-flash';
                let systemContent = "";
                const contents = body.messages.map((m: any) => {
                    if (m.role === 'system') {
                        systemContent += m.content + "\n";
                        return null;
                    }

                    let parts: any[] = [];
                    if (Array.isArray(m.content)) {
                        parts = m.content.map((c: any) => {
                            if (c.type === 'image_url') {
                                const [mimeInfo, base64] = c.image_url.url.split(';base64,');
                                const mimeType = mimeInfo.replace('data:', '');
                                return { inlineData: { mimeType, data: base64 } };
                            }
                            return { text: c.text };
                        });
                    } else {
                        parts = [{ text: m.content }];
                    }

                    return {
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts
                    };
                }).filter(Boolean);

                const reqBody: any = { contents };
                if (systemContent) {
                    reqBody.systemInstruction = { parts: [{ text: systemContent }] };
                }

                if (body.response_format?.type === "json_object") {
                    reqBody.generationConfig = { responseMimeType: "application/json" };
                }

                if (body.temperature !== undefined) {
                    reqBody.generationConfig = { ...(reqBody.generationConfig || {}), temperature: body.temperature };
                }

                try {
                    require('fs').appendFileSync('gemini-req.log', `--- GEMINI REQ [${model}] ---\n` + JSON.stringify(reqBody, null, 2) + '\n\n');
                } catch (e) { }

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reqBody)
                });

                if (!res.ok) {
                    throw new Error(`Gemini API Error: ${res.status} - ${await res.text()}`);
                }
                const data = await res.json();

                return {
                    choices: [{
                        message: {
                            content: data.candidates?.[0]?.content?.parts?.[0]?.text || ""
                        }
                    }]
                };
            }
        }
    }
}

export async function getAiClient(options: {
    provider?: string,
    model?: string,
    tenant: {
        openaiApiKey?: string | null,
        geminiApiKey?: string | null,
        openrouterApiKey?: string | null
    }
}) {
    const provider = options.provider || 'openai';
    let model = options.model || 'gpt-4o-mini';

    if (provider === 'openrouter') {
        const apiKey = options.tenant.openrouterApiKey || process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('OpenRouter API Key not configured');
        return {
            client: new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' }),
            model,
        };
    }

    if (provider === 'gemini') {
        const apiKey = options.tenant.geminiApiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Gemini API Key not configured');

        // Force upgrade legacy gemini models and fix invalid ones
        if (model.includes('gemini-1.5') || model.includes('gemini-1.0') || model.includes('gemini-2.0') || model.includes('2.5')) {
            if (!model.includes('flash') && !model.includes('pro')) {
                model = 'gemini-1.5-flash';
            } else if (model.includes('2.5')) {
                model = 'gemini-2.0-flash'; // 2.5 doesn't exist yet, use 2.0
            }
        } else {
            model = 'gemini-1.5-flash';
        }

        return {
            client: new GeminiWrapper(apiKey) as any,
            model,
        };
    }

    // Default: OpenAI
    const apiKey = options.tenant.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API Key not configured');
    return {
        client: new OpenAI({ apiKey }),
        model,
    };
}

/**
 * Enhanced AI completion with automatic fallback between providers.
 */
export async function safeChatCompletion(options: {
    messages: any[],
    temperature?: number,
    response_format?: { type: "json_object" | "text" },
    max_tokens?: number,
    bot: any
}) {
    const { bot, messages, temperature, response_format, max_tokens } = options;
    const providersToTry = [];

    // Order of preference based on configuration
    const primary = bot.aiProvider || 'openai';
    providersToTry.push(primary);

    const fallbacks = ['gemini', 'openai', 'openrouter'].filter(p => p !== primary);
    providersToTry.push(...fallbacks);

    let lastError = null;

    for (const provider of providersToTry) {
        try {
            // Check if provider has API key
            const hasKey = (provider === 'gemini' && (bot.tenant.geminiApiKey || process.env.GEMINI_API_KEY)) ||
                (provider === 'openai' && (bot.tenant.openaiApiKey || process.env.OPENAI_API_KEY)) ||
                (provider === 'openrouter' && (bot.tenant.openrouterApiKey || process.env.OPENROUTER_API_KEY));

            if (!hasKey) continue;

            const { client, model } = await getAiClient({
                provider,
                model: provider === bot.aiProvider ? bot.aiModel : undefined, // only use bot.aiModel for primary
                tenant: bot.tenant
            });

            console.log(`[SafeAI] Attempting ${provider} with model ${model}`);
            const completion = await client.chat.completions.create({
                model,
                messages,
                temperature: temperature ?? 0.7,
                response_format,
                max_tokens
            });

            const content = completion.choices[0]?.message?.content;
            if (content) return content;

        } catch (err: any) {
            console.error(`[SafeAI] Provider ${provider} failed:`, err.message);
            lastError = err;
            // If it's a quota error or internal error, continue to next provider
            if (err.message.includes('429') || err.message.includes('Quota') || err.message.includes('500')) {
                continue;
            }
            // For other errors, maybe stop? For now, let's try everything
        }
    }

    throw lastError || new Error("All AI providers failed.");
}
