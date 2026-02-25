import { buildSystemPrompt, buildConversationMessages } from './prompts'

describe('Engine Prompts', () => {
    describe('buildSystemPrompt', () => {
        it('generates prompt with bot business details', () => {
            const prompt = buildSystemPrompt({
                name: 'Pizzaria do Zé',
                businessType: 'Pizzaria',
                address: 'Rua das Flores, 123',
                hours: 'Seg-Sab 18h-23h',
                paymentMethods: ['PIX', 'Cartão', 'Dinheiro'],
                systemPrompt: null,
            })

            expect(prompt).toContain('Pizzaria do Zé')
            expect(prompt).toContain('Pizzaria')
            expect(prompt).toContain('Rua das Flores, 123')
            expect(prompt).toContain('Seg-Sab 18h-23h')
            expect(prompt).toContain('PIX, Cartão, Dinheiro')
        })

        it('includes sales triggers and closing techniques', () => {
            const prompt = buildSystemPrompt({
                name: 'Test Bot',
                businessType: 'Loja',
                paymentMethods: [],
                systemPrompt: null,
            })

            expect(prompt).toContain('RESPOSTAS CURTAS')
            expect(prompt).toContain('TOM HUMANO')
            expect(prompt).toContain('VENDER')
            expect(prompt).toContain('GATILHOS DE VENDA')
            expect(prompt).toContain('Posso fechar pra você')
        })

        it('enforces no AI disclosure rule', () => {
            const prompt = buildSystemPrompt({
                name: 'Test Bot',
                businessType: 'Loja',
                paymentMethods: [],
                systemPrompt: null,
            })

            expect(prompt).toContain('NUNCA diga "sou uma IA"')
        })

        it('includes anti-loop conversation rules', () => {
            const prompt = buildSystemPrompt({
                name: 'Test Bot',
                businessType: 'Loja',
                paymentMethods: [],
                systemPrompt: null,
            })

            expect(prompt).toContain('NUNCA peça uma informação que o cliente JÁ forneceu')
            expect(prompt).toContain('REGRAS DE CONVERSAÇÃO')
        })

        it('uses custom systemPrompt when available', () => {
            const prompt = buildSystemPrompt({
                name: 'Custom Bot',
                businessType: 'Custom',
                paymentMethods: [],
                systemPrompt: 'You are a super custom bot with specific rules.',
            })

            expect(prompt).toBe('You are a super custom bot with specific rules.')
            expect(prompt).not.toContain('GATILHOS DE VENDA')
        })

        it('handles missing optional fields gracefully', () => {
            const prompt = buildSystemPrompt({
                name: 'Basic Bot',
                businessType: 'Serviço',
                paymentMethods: [],
                systemPrompt: null,
            })

            expect(prompt).toContain('Basic Bot')
            expect(prompt).toContain('consultar com atendente')
            expect(prompt).not.toContain('Endereço:')
            expect(prompt).not.toContain('Horário:')
        })

        it('includes relevant knowledge when provided', () => {
            const prompt = buildSystemPrompt({
                name: 'Test Bot',
                businessType: 'Loja',
                paymentMethods: [],
                systemPrompt: null,
                relevantKnowledge: 'Pizza margherita R$35, Calabresa R$40',
            })

            expect(prompt).toContain('Pizza margherita R$35')
            expect(prompt).toContain('INFORMAÇÕES RELEVANTES')
        })

        it('includes media list when provided', () => {
            const prompt = buildSystemPrompt({
                name: 'Test Bot',
                businessType: 'Loja',
                paymentMethods: [],
                systemPrompt: null,
                mediaList: [
                    { id: 'media-1', type: 'pdf', description: 'Cardápio completo' },
                    { id: 'media-2', type: 'image', description: 'Foto da loja' },
                ],
            })

            expect(prompt).toContain('MATERIAIS DISPONÍVEIS')
            expect(prompt).toContain('Cardápio completo')
            expect(prompt).toContain('ENVIAR_MEDIA')
        })

        it('includes contact info when provided', () => {
            const prompt = buildSystemPrompt({
                name: 'Test Bot',
                businessType: 'Loja',
                paymentMethods: [],
                systemPrompt: null,
                contactInfo: {
                    name: 'João Silva',
                    email: 'joao@test.com',
                    company: 'Empresa X',
                },
            })

            expect(prompt).toContain('PERFIL DO CLIENTE')
            expect(prompt).toContain('João Silva')
            expect(prompt).toContain('joao@test.com')
            expect(prompt).toContain('NÃO peça novamente')
        })

        it('includes website URL when provided', () => {
            const prompt = buildSystemPrompt({
                name: 'Test Bot',
                businessType: 'Loja',
                paymentMethods: [],
                systemPrompt: null,
                websiteUrl: 'https://meusite.com',
            })

            expect(prompt).toContain('https://meusite.com')
        })
    })

    describe('buildConversationMessages', () => {
        it('prepends system prompt', () => {
            const messages = buildConversationMessages('System instruction', [])
            expect(messages[0]).toEqual({ role: 'system', content: 'System instruction' })
        })

        it('maps user and assistant roles correctly', () => {
            const messages = buildConversationMessages('System', [
                { role: 'user', content: 'Oi' },
                { role: 'assistant', content: 'Olá!' },
            ])

            expect(messages).toHaveLength(3)
            expect(messages[1]).toEqual({ role: 'user', content: 'Oi' })
            expect(messages[2]).toEqual({ role: 'assistant', content: 'Olá!' })
        })

        it('limits history to last 20 messages', () => {
            const longHistory = Array.from({ length: 30 }, (_, i) => ({
                role: 'user',
                content: `Message ${i}`,
            }))

            const messages = buildConversationMessages('System', longHistory)
            // 1 system + 20 history = 21
            expect(messages).toHaveLength(21)
            expect(messages[1].content).toBe('Message 10')
        })
    })
})
