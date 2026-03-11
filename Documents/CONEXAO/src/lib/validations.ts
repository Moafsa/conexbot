import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────

export const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    whatsapp: z.string().optional(),
    cpfCnpj: z.string().optional(),
    planId: z.string().optional(),
    interval: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY']).optional(),
    trial: z.string().optional(), // Comes as string boolean from URL
});

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

// ─── Bot ─────────────────────────────────────────────────────────

export const createBotSchema = z.object({
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
    aiProvider: z.string().optional().default('openai'),
    aiModel: z.string().optional().default('gpt-4o-mini'),
    messageBuffer: z.number().min(0).max(10000).optional().default(1500),
    asaasApiKey: z.string().optional().or(z.literal('')),
    userSplitType: z.enum(['FIXED', 'PERCENTAGE']).optional().default('PERCENTAGE'),
    userSplitValue: z.number().min(0).max(10).optional().default(0), // Limit to 10 by default, UI will enforce
    schedulingProvider: z.enum(['INTERNAL', 'GOOGLE']).optional(),
    appointmentDuration: z.number().int().min(1).optional(),
    workingHours: z.any().optional(),
    groupResponseMode: z.enum(['ALL', 'NONE', 'SPECIFIC']).optional().default('ALL'),
    allowedGroups: z.array(z.string()).optional().default([]),
});

export const updateBotSchema = createBotSchema.partial();

// ─── Checkout ────────────────────────────────────────────────────

export const checkoutSchema = z.object({
    plan: z.string(), // Plan ID or name (Enterprise/Starter etc)
    interval: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY']).optional().default('MONTHLY'),
    gateway: z.enum(['asaas', 'mercadopago']),
});

// ─── AI Architect ────────────────────────────────────────────────

export const aiArchitectSchema = z.object({
    message: z.string().min(1, 'Mensagem é obrigatória'),
    history: z.array(z.object({
        role: z.enum(['user', 'ai']),
        content: z.string(),
    })),
});

// ─── WhatsApp ────────────────────────────────────────────────────

export const whatsappConnectSchema = z.object({
    sessionName: z.string().min(1),
    botId: z.string().uuid(),
});
