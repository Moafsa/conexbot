import {
    registerSchema,
    loginSchema,
    createBotSchema,
    updateBotSchema,
    checkoutSchema,
    aiArchitectSchema,
    whatsappConnectSchema,
} from './validations'

describe('Validation Schemas', () => {
    describe('registerSchema', () => {
        it('accepts valid registration data', () => {
            const result = registerSchema.safeParse({
                name: 'João Silva',
                email: 'joao@empresa.com',
                password: 'senha123',
            })
            expect(result.success).toBe(true)
        })

        it('rejects short name', () => {
            const result = registerSchema.safeParse({
                name: 'J',
                email: 'joao@empresa.com',
                password: 'senha123',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid email', () => {
            const result = registerSchema.safeParse({
                name: 'João',
                email: 'not-an-email',
                password: 'senha123',
            })
            expect(result.success).toBe(false)
        })

        it('rejects short password', () => {
            const result = registerSchema.safeParse({
                name: 'João',
                email: 'joao@empresa.com',
                password: '123',
            })
            expect(result.success).toBe(false)
        })

        it('accepts optional whatsapp', () => {
            const result = registerSchema.safeParse({
                name: 'João',
                email: 'joao@empresa.com',
                password: 'senha123',
                whatsapp: '11999999999',
            })
            expect(result.success).toBe(true)
        })
    })

    describe('loginSchema', () => {
        it('accepts valid login data', () => {
            const result = loginSchema.safeParse({
                email: 'test@test.com',
                password: 'password',
            })
            expect(result.success).toBe(true)
        })

        it('rejects empty password', () => {
            const result = loginSchema.safeParse({
                email: 'test@test.com',
                password: '',
            })
            expect(result.success).toBe(false)
        })
    })

    describe('createBotSchema', () => {
        it('accepts valid bot data', () => {
            const result = createBotSchema.safeParse({
                name: 'Meu Bot',
                businessType: 'Pizzaria',
            })
            expect(result.success).toBe(true)
        })

        it('rejects missing name', () => {
            const result = createBotSchema.safeParse({
                name: '',
                businessType: 'Pizzaria',
            })
            expect(result.success).toBe(false)
        })

        it('accepts optional fields', () => {
            const result = createBotSchema.safeParse({
                name: 'Bot Completo',
                businessType: 'Restaurante',
                address: 'Rua 1',
                hours: '9h-18h',
                paymentMethods: ['PIX', 'Cartão'],
                knowledgeBase: 'Cardápio: ...',
                systemPrompt: 'Custom prompt...',
            })
            expect(result.success).toBe(true)
        })
    })

    describe('updateBotSchema', () => {
        it('accepts partial updates', () => {
            const result = updateBotSchema.safeParse({
                name: 'Novo Nome',
            })
            expect(result.success).toBe(true)
        })

        it('accepts empty object', () => {
            const result = updateBotSchema.safeParse({})
            expect(result.success).toBe(true)
        })
    })

    describe('checkoutSchema', () => {
        it('accepts valid checkout', () => {
            const result = checkoutSchema.safeParse({
                plan: 'pro',
                gateway: 'asaas',
            })
            expect(result.success).toBe(true)
        })

        it('rejects invalid plan', () => {
            const result = checkoutSchema.safeParse({
                plan: 'ultra',
                gateway: 'asaas',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid gateway', () => {
            const result = checkoutSchema.safeParse({
                plan: 'starter',
                gateway: 'paypal',
            })
            expect(result.success).toBe(false)
        })

        it('accepts all valid plans', () => {
            for (const plan of ['starter', 'pro', 'enterprise']) {
                const result = checkoutSchema.safeParse({ plan, gateway: 'asaas' })
                expect(result.success).toBe(true)
            }
        })

        it('accepts all valid gateways', () => {
            for (const gateway of ['asaas', 'mercadopago']) {
                const result = checkoutSchema.safeParse({ plan: 'starter', gateway })
                expect(result.success).toBe(true)
            }
        })
    })

    describe('aiArchitectSchema', () => {
        it('accepts valid AI architect message', () => {
            const result = aiArchitectSchema.safeParse({
                message: 'Olá',
                history: [{ role: 'user', content: 'Oi' }],
            })
            expect(result.success).toBe(true)
        })

        it('rejects empty message', () => {
            const result = aiArchitectSchema.safeParse({
                message: '',
                history: [],
            })
            expect(result.success).toBe(false)
        })
    })

    describe('whatsappConnectSchema', () => {
        it('accepts valid connection data', () => {
            const result = whatsappConnectSchema.safeParse({
                sessionName: 'bot-abc123',
                botId: '550e8400-e29b-41d4-a716-446655440000',
            })
            expect(result.success).toBe(true)
        })

        it('rejects invalid UUID for botId', () => {
            const result = whatsappConnectSchema.safeParse({
                sessionName: 'bot-abc',
                botId: 'not-a-uuid',
            })
            expect(result.success).toBe(false)
        })
    })
})
