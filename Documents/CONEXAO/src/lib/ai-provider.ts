import OpenAI from 'openai';

// ─── Anthropic / Claude Wrapper ─────────────────────────────────────────────
// Translates OpenAI-compatible message format to Anthropic Messages API
export class AnthropicWrapper {
    constructor(private apiKey: string) { }
    chat = {
        completions: {
            create: async (body: any) => {
                const model = body.model || 'claude-sonnet-4-5';
                let systemContent = '';
                const messages: any[] = [];

                for (const m of body.messages) {
                    if (m.role === 'system') {
                        systemContent += m.content + '\n';
                        continue;
                    }

                    let content = m.content;
                    if (!content && m.tool_calls) {
                        content = `[AI ACTION: ${m.tool_calls.map((tc: any) => tc.function.name).join(', ')}]`;
                    }
                    if (m.role === 'tool') {
                        content = `[TOOL RESULT: ${m.content}]`;
                    }

                    if (!content || (typeof content === 'string' && content.trim() === '')) continue;

                    messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(content) });
                }

                const reqBody: any = {
                    model,
                    max_tokens: body.max_tokens || 4096,
                    messages,
                };

                if (systemContent.trim()) {
                    reqBody.system = systemContent.trim();
                }

                if (body.temperature !== undefined) {
                    reqBody.temperature = body.temperature;
                }

                const res = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                    },
                    body: JSON.stringify(reqBody),
                });

                if (!res.ok) {
                    throw new Error(`Anthropic API Error: ${res.status} - ${await res.text()}`);
                }

                const data = await res.json();

                return {
                    choices: [{
                        message: {
                            content: data.content?.[0]?.text || ''
                        }
                    }],
                    usage: {
                        prompt_tokens: data.usage?.input_tokens ?? 0,
                        completion_tokens: data.usage?.output_tokens ?? 0,
                    }
                };
            }
        }
    }
}

// Helper to get AI client and config
export class GeminiWrapper {
    constructor(private apiKey: string) { }
    chat = {
        completions: {
            create: async (body: any) => {
                let model = body.model || 'gemini-1.5-flash';
                model = model.replace(/^models\//, '');
                let systemContent = "";
                const contents = body.messages.map((m: any) => {
                    if (m.role === 'system') {
                        systemContent += m.content + "\n";
                        return null;
                    }

                    // Convert messages with tool_calls or role tool to something Gemini understands (plain text)
                    let content = m.content;
                    if (!content && m.tool_calls) {
                        content = `[AI ACTION: ${m.tool_calls.map((tc: any) => tc.function.name).join(', ')}]`;
                    }
                    if (m.role === 'tool') {
                        content = `[TOOL RESULT: ${m.content}]`;
                    }

                    if (!content || (typeof content === 'string' && content.trim() === "")) {
                        return null; // Ignore empty parts to avoid 400
                    }

                    let parts: any[] = [];
                    if (Array.isArray(content)) {
                        parts = content.map((c: any) => {
                            if (c.type === 'image_url') {
                                const [mimeInfo, base64] = c.image_url.url.split(';base64,');
                                const mimeType = mimeInfo.replace('data:', '');
                                return { inlineData: { mimeType, data: base64 } };
                            }
                            return { text: c.text || "[Empty Part]" };
                        });
                    } else {
                        parts = [{ text: String(content) }];
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
        openrouterApiKey?: string | null,
        anthropicApiKey?: string | null,
        agency?: {
            openaiApiKey?: string | null,
            geminiApiKey?: string | null,
            openrouterApiKey?: string | null,
            anthropicApiKey?: string | null,
        } | null,
        managedBy?: {
            openaiApiKey?: string | null,
            geminiApiKey?: string | null,
            openrouterApiKey?: string | null,
            anthropicApiKey?: string | null,
        } | null
    }
}) {
    const provider = options.provider || 'openai';
    let model = options.model || 'gpt-4o-mini';

    const resolveKey = (key: string, envName: string) => {
        return (options.tenant as any)[key] || 
               options.tenant.agency?.[key as keyof typeof options.tenant.agency] || 
               options.tenant.managedBy?.[key as keyof typeof options.tenant.managedBy] || 
               process.env[envName];
    };

    if (provider === 'anthropic') {
        const apiKey = resolveKey('anthropicApiKey', 'ANTHROPIC_API_KEY');
        if (!apiKey) throw new Error('Anthropic API Key not configured');
        let claudeModel = options.model || 'claude-3-5-sonnet-latest';
        if (claudeModel === 'claude-sonnet-4-5') {
            claudeModel = 'claude-3-5-sonnet-latest';
        }
        return {
            client: new AnthropicWrapper(apiKey) as any,
            model: claudeModel,
        };
    }

    if (provider === 'openrouter') {
        const apiKey = resolveKey('openrouterApiKey', 'OPENROUTER_API_KEY');
        if (!apiKey) throw new Error('OpenRouter API Key not configured');
        return {
            client: new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' }),
            model,
        };
    }

    if (provider === 'gemini') {
        const apiKey = resolveKey('geminiApiKey', 'GEMINI_API_KEY');
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
    const apiKey = resolveKey('openaiApiKey', 'OPENAI_API_KEY');
    if (!apiKey) throw new Error('OpenAI API Key not configured');
    return {
        client: new OpenAI({ apiKey }),
        model,
    };
}

/**
 * Enhanced AI completion with automatic fallback between providers and Tool Calling support.
 */
export async function safeChatCompletion(options: {
    messages: any[],
    temperature?: number,
    response_format?: { type: "json_object" | "text" },
    max_tokens?: number,
    tools?: any[],
    tool_choice?: any,
    bot: any
}) {
    const { bot, messages, temperature, response_format, max_tokens, tools, tool_choice } = options;
    const providersToTry = [];

    // Order of preference based on configuration
    const primary = bot.aiProvider || 'openai';
    providersToTry.push(primary);

    const fallbacks = ['anthropic', 'gemini', 'openai', 'openrouter'].filter(p => p !== primary);
    providersToTry.push(...fallbacks);

    let lastError = null;

    for (const provider of providersToTry) {
        try {
            const resolveKey = (key: string, envName: string) => {
                return (bot.tenant as any)[key] || 
                       bot.tenant.agency?.[key] || 
                       bot.tenant.managedBy?.[key] || 
                       process.env[envName];
            };

            // Check if provider has API key
            const hasKey = (provider === 'anthropic' && resolveKey('anthropicApiKey', 'ANTHROPIC_API_KEY')) ||
                (provider === 'gemini' && resolveKey('geminiApiKey', 'GEMINI_API_KEY')) ||
                (provider === 'openai' && resolveKey('openaiApiKey', 'OPENAI_API_KEY')) ||
                (provider === 'openrouter' && resolveKey('openrouterApiKey', 'OPENROUTER_API_KEY'));

            if (!hasKey) continue;

            const { client, model } = await getAiClient({
                provider,
                model: provider === bot.aiProvider ? bot.aiModel : undefined, // only use bot.aiModel for primary
                tenant: bot.tenant
            });

            console.log(`[SafeAI] Attempting ${provider} with model ${model}`);
            
            const completionOptions: any = {
                model,
                messages,
                temperature: temperature ?? 0.7,
                response_format,
                max_tokens,
            };

            // GeminiWrapper does not support tool calling yet.
            // When Gemini is the PRIMARY provider and tools are required, log a warning
            // so the fallback to OpenAI/OpenRouter is visible in logs rather than silent.
            if (provider === 'gemini' && tools && tools.length > 0) {
                if (provider === bot.aiProvider) {
                    console.warn(
                        `[SafeAI] WARNING: Bot "${bot.name}" has Gemini as primary provider but ` +
                        `this request requires tool calling (${tools.length} tool(s)). ` +
                        `Gemini does not support tools — falling back to next provider. ` +
                        `Consider changing the bot's AI provider to OpenAI or OpenRouter.`
                    );
                }
                // Skip tools for Gemini — continue to next provider in loop
                continue;
            }

            if (tools && tools.length > 0) {
                completionOptions.tools = tools;
                completionOptions.tool_choice = tool_choice;
            }

            const completion = await client.chat.completions.create(completionOptions);
            console.log(`[SafeAI] [${provider}] Raw Completion Choices:`, JSON.stringify(completion.choices, null, 2));

            const content = completion.choices[0]?.message?.content;
            const toolCalls = completion.choices[0]?.message?.tool_calls;

            if (content || toolCalls) {
                return {
                    content,
                    toolCalls,
                    provider,
                    inputTokens: completion.usage?.prompt_tokens ?? 0,
                    outputTokens: completion.usage?.completion_tokens ?? 0,
                };
            }

        } catch (err: any) {
            console.error(`[SafeAI] Provider ${provider} failed:`, err.message);
            lastError = err;
            // Fallback to next provider for ANY error (401 Auth, 429 Quota, 500, etc)
            continue;
        }
    }

    throw lastError || new Error("All AI providers failed.");
}
