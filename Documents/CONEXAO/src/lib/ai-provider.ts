import OpenAI from 'openai';

// Helper to get AI client and config
export class GeminiWrapper {
    constructor(private apiKey: string) { }
    chat = {
        completions: {
            create: async (body: any) => {
                const model = body.model;
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

        // Force upgrade legacy gemini models
        if (model.includes('gemini-1.5') || model.includes('gemini-1.0') || model === 'gemini-2.0-flash') {
            model = 'gemini-2.5-flash';
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
