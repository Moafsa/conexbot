const { z } = require('zod');

const createBotSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    businessType: z.string().min(1, 'Tipo de negócio é obrigatório'),
    voiceId: z.string().optional(),
    modules: z.array(z.string()).optional().default([]),
    address: z.string().optional(),
    hours: z.string().optional(),
    paymentMethods: z.array(z.string()).optional().default([]),
    knowledgeBase: z.string().optional(),
    description: z.string().optional(),
    productsServices: z.string().optional(),
    systemPrompt: z.string().optional(),
    websiteUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    enablePayments: z.boolean().optional().default(false),
    fallbackContact: z.string().regex(/^\d{10,15}$/, 'WhatsApp inválido (ex: 5511999999999)').optional(),
    webhookUrl: z.string().url('URL de webhook inválida').optional().or(z.literal('')),
    webhookToken: z.string().optional(),
    chatwootUrl: z.string().url('URL do Chatwoot inválida').optional().or(z.literal('')),
    chatwootToken: z.string().optional(),
    chatwootAccountId: z.string().optional(),
});

const updateBotSchema = createBotSchema.partial();

const body = {
    name: "Meu Bot",
    description: "Essa é uma descrição legal",
    systemPrompt: "Você é um bot feliz."
};

console.log("Parsed:", updateBotSchema.safeParse(body));
