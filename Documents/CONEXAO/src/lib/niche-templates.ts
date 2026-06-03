export interface NicheTemplate {
    niche: string;
    label: string;
    businessType: string;
    aiModel: string;
    modules: string[];
    systemPromptHint: string;
    crmStages: { name: string; color: string; order: number }[];
    followupRules: { name: string; triggerType: string; triggerDays: number; triggerUnit: string; message: string }[];
    marketingTopics: string[];
}

export const NICHE_TEMPLATES: Record<string, NicheTemplate> = {
    restaurante: {
        niche: 'restaurante',
        label: 'Restaurante / Delivery',
        businessType: 'FOOD',
        aiModel: 'gpt-4o-mini',
        modules: ['whatsapp', 'crm', 'payments', 'scheduling'],
        systemPromptHint:
            'Você é um atendente virtual de um restaurante/delivery. Responda de forma acolhedora e apetitosa. ' +
            'SUAS RESPONSABILIDADES:\n' +
            '1. CARDÁPIO: Apresente o cardápio de forma clara e sugira acompanhamentos para aumentar o ticket médio.\n' +
            '2. DELIVERY/RETIRADA: Pergunte se é para entrega ou retirada. Se for entrega, solicite o endereço completo (Rua, Número, Bairro, Ponto de Referência) para calcular a taxa de entrega (verifique nas regras financeiras do seu contexto se há taxa fixa ou por bairro).\n' +
            '3. RESERVA DE MESA: Se o cliente quiser reservar uma mesa, pergunte para quantas pessoas e para qual data/hora. Confirme a disponibilidade e registre o agendamento.\n' +
            '4. FECHAMENTO: Antes de fechar o pedido, confirme todos os itens, o endereço de entrega, a taxa e a forma de pagamento.',
        crmStages: [
            { name: 'Novo Contato', color: '#94a3b8', order: 0 },
            { name: 'Escolhendo Pedido', color: '#f59e0b', order: 1 },
            { name: 'Pedido Confirmado', color: '#3b82f6', order: 2 },
            { name: 'Em Preparo', color: '#8b5cf6', order: 3 },
            { name: 'Saiu para Entrega', color: '#f97316', order: 4 },
            { name: 'Entregue', color: '#22c55e', order: 5 },
            { name: 'Avaliação Pendente', color: '#ec4899', order: 6 },
        ],
        followupRules: [
            {
                name: 'Follow-up 3 dias',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 3,
                triggerUnit: 'DAYS',
                message: 'Olá, {nome}! 😋 Sentimos sua falta! Que tal pedir novamente? Temos novidades no cardápio te esperando!',
            },
            {
                name: 'Follow-up 7 dias',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 7,
                triggerUnit: 'DAYS',
                message: 'Oi, {nome}! 🍽️ Passando para compartilhar uma novidade especial pra você. Posso te contar?',
            },
        ],
        marketingTopics: ['Pratos do dia', 'Promoções de fim de semana', 'Combos especiais', 'Novidades do cardápio'],
    },

    clinica: {
        niche: 'clinica',
        label: 'Clínica / Saúde',
        businessType: 'HEALTH',
        aiModel: 'gpt-4o-mini',
        modules: ['whatsapp', 'crm', 'scheduling'],
        systemPromptHint:
            'Você é a recepcionista virtual de uma clínica. Seja empática, profissional e discreta. ' +
            'Ajude pacientes a agendar consultas, informe sobre especialidades disponíveis e horários. ' +
            'Capture nome completo, data de nascimento, convênio e motivo da consulta.',
        crmStages: [
            { name: 'Primeiro Contato', color: '#94a3b8', order: 0 },
            { name: 'Informações Solicitadas', color: '#f59e0b', order: 1 },
            { name: 'Agendamento Pendente', color: '#3b82f6', order: 2 },
            { name: 'Consulta Agendada', color: '#22c55e', order: 3 },
            { name: 'Paciente Ativo', color: '#8b5cf6', order: 4 },
            { name: 'Retorno Pendente', color: '#ec4899', order: 5 },
        ],
        followupRules: [
            {
                name: 'Confirmação de consulta',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 1,
                triggerUnit: 'DAYS',
                message: 'Olá, {nome}! Gostaríamos de confirmar sua consulta amanhã. Tudo certo para o seu horário?',
            },
            {
                name: 'Retorno 30 dias',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 30,
                triggerUnit: 'DAYS',
                message: 'Olá, {nome}! Já faz um mês desde sua última consulta. Está na hora de um retorno? Podemos ajudar a agendar.',
            },
        ],
        marketingTopics: ['Dicas de saúde', 'Prevenção sazonal', 'Novos procedimentos', 'Promoções de check-up'],
    },

    ecommerce: {
        niche: 'ecommerce',
        label: 'E-commerce / Loja Virtual',
        businessType: 'ECOMMERCE',
        aiModel: 'gpt-4o-mini',
        modules: ['whatsapp', 'crm', 'payments', 'products'],
        systemPromptHint:
            'Você é o assistente de vendas de uma loja virtual. Seja ágil e focado em conversão. ' +
            'Apresente produtos, tire dúvidas sobre tamanhos/cores/estoque, informe sobre frete e prazo de entrega, ' +
            'processe pedidos e acompanhe o status de entregas. Capture nome, email e endereço para finalizar compras.',
        crmStages: [
            { name: 'Visitante', color: '#94a3b8', order: 0 },
            { name: 'Interesse Identificado', color: '#f59e0b', order: 1 },
            { name: 'Carrinho Ativo', color: '#3b82f6', order: 2 },
            { name: 'Pagamento Pendente', color: '#f97316', order: 3 },
            { name: 'Pedido Confirmado', color: '#22c55e', order: 4 },
            { name: 'Em Transporte', color: '#8b5cf6', order: 5 },
            { name: 'Entregue / Pós-venda', color: '#ec4899', order: 6 },
        ],
        followupRules: [
            {
                name: 'Carrinho abandonado 2h',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 1,
                triggerUnit: 'DAYS',
                message: 'Oi, {nome}! Vi que você estava vendo alguns produtos. Posso ajudar a finalizar sua compra? 🛍️',
            },
            {
                name: 'Reengajamento 7 dias',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 7,
                triggerUnit: 'DAYS',
                message: 'Olá, {nome}! Temos novidades que combinam com o que você estava procurando. Quer ver?',
            },
        ],
        marketingTopics: ['Lançamentos', 'Promoções relâmpago', 'Produtos mais vendidos', 'Dicas de uso'],
    },

    salao: {
        niche: 'salao',
        label: 'Salão de Beleza / Barbearia',
        businessType: 'BEAUTY',
        aiModel: 'gpt-4o-mini',
        modules: ['whatsapp', 'crm', 'scheduling', 'payments'],
        systemPromptHint:
            'Você é a recepcionista virtual de um salão de beleza. Seja simpática e atenciosa. ' +
            'Apresente os serviços disponíveis, profissionais, horários vagos e preços. ' +
            'Agende horários e colete nome, serviço desejado e preferência de profissional.',
        crmStages: [
            { name: 'Novo Contato', color: '#94a3b8', order: 0 },
            { name: 'Consultando Serviços', color: '#f59e0b', order: 1 },
            { name: 'Agendamento Pendente', color: '#3b82f6', order: 2 },
            { name: 'Horário Confirmado', color: '#22c55e', order: 3 },
            { name: 'Cliente Fidelizado', color: '#8b5cf6', order: 4 },
        ],
        followupRules: [
            {
                name: 'Lembrete do horário',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 1,
                triggerUnit: 'DAYS',
                message: 'Oi, {nome}! Lembrando que seu horário é amanhã. Qualquer dúvida, é só chamar! 💅',
            },
            {
                name: 'Reengajamento 30 dias',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 30,
                triggerUnit: 'DAYS',
                message: 'Olá, {nome}! Já passou um mês desde sua última visita. Que tal renovar o visual? Temos horários disponíveis esta semana!',
            },
        ],
        marketingTopics: ['Transformações do dia', 'Dicas de cuidados', 'Promoções da semana', 'Antes e depois'],
    },

    imobiliaria: {
        niche: 'imobiliaria',
        label: 'Imobiliária / Corretor',
        businessType: 'REAL_ESTATE',
        aiModel: 'gpt-4o-mini',
        modules: ['whatsapp', 'crm'],
        systemPromptHint:
            'Você é um assistente imobiliário virtual. Seja consultivo e profissional. ' +
            'Qualifique o cliente (compra/aluguel, região, orçamento, perfil de imóvel). ' +
            'Apresente opções compatíveis com o perfil, agende visitas e capte o contato para um corretor dar continuidade.',
        crmStages: [
            { name: 'Lead Novo', color: '#94a3b8', order: 0 },
            { name: 'Em Qualificação', color: '#f59e0b', order: 1 },
            { name: 'Perfil Definido', color: '#3b82f6', order: 2 },
            { name: 'Visita Agendada', color: '#8b5cf6', order: 3 },
            { name: 'Proposta em Andamento', color: '#f97316', order: 4 },
            { name: 'Contrato Fechado', color: '#22c55e', order: 5 },
        ],
        followupRules: [
            {
                name: 'Novos imóveis 2 dias',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 2,
                triggerUnit: 'DAYS',
                message: 'Olá, {nome}! Encontramos novos imóveis que combinam com o seu perfil. Posso te enviar as opções?',
            },
            {
                name: 'Reengajamento 7 dias',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 7,
                triggerUnit: 'DAYS',
                message: 'Oi, {nome}! Ainda está buscando imóveis? O mercado está movimentado e temos novidades. Vamos conversar?',
            },
        ],
        marketingTopics: ['Lançamentos', 'Imóveis em destaque', 'Dicas para comprar o primeiro imóvel', 'Mercado imobiliário'],
    },

    generico: {
        niche: 'generico',
        label: 'Negócio Genérico',
        businessType: 'GENERIC',
        aiModel: 'gpt-4o-mini',
        modules: ['whatsapp', 'crm'],
        systemPromptHint:
            'Você é um assistente virtual de atendimento. Seja cordial e prestativo. ' +
            'Responda dúvidas sobre produtos e serviços, capture informações de contato e qualifique o interesse do cliente.',
        crmStages: [
            { name: 'Novo Lead', color: '#94a3b8', order: 0 },
            { name: 'Em Contato', color: '#f59e0b', order: 1 },
            { name: 'Qualificado', color: '#3b82f6', order: 2 },
            { name: 'Proposta Enviada', color: '#8b5cf6', order: 3 },
            { name: 'Cliente', color: '#22c55e', order: 4 },
        ],
        followupRules: [
            {
                name: 'Follow-up 3 dias',
                triggerType: 'AFTER_LAST_MESSAGE',
                triggerDays: 3,
                triggerUnit: 'DAYS',
                message: 'Olá, {nome}! Passando para saber se ainda posso te ajudar com alguma dúvida. 😊',
            },
        ],
        marketingTopics: ['Novidades', 'Depoimentos de clientes', 'Dicas do setor', 'Promoções'],
    },
};

export function getNicheTemplate(niche: string): NicheTemplate {
    return NICHE_TEMPLATES[niche] ?? NICHE_TEMPLATES.generico;
}
