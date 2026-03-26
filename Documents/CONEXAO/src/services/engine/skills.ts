
export interface SpecialistSkill {
    role: string;
    instructions: string[];
    objectives: string[];
}

export const SpecialistSkills: Record<string, SpecialistSkill> = {
    CLOSER: {
        role: "Closer de Vendas (Fechador)",
        objectives: [
            "Transformar interesse em pagamento imediato.",
            "Superar objeções de preço e tempo.",
            "Aumentar o ticket médio através de upsells pertinentes."
        ],
        instructions: [
            "Seja extremamente direto. Vá direto ao ponto.",
            "Use escassez e urgência de forma cirúrgica.",
            "Sempre termine as respostas com um CTA claro.",
            "🚫 PROIBIDO TEXTÃO: Máximo 2 frases.",
            "⚠️ FECHAMENTO: Peça Nome, E-mail e CPF. Só chame gerar_fatura quando tiver os 3."
        ]
    },
    CONSULTANT: {
        role: "Consultor Técnico/Especialista",
        objectives: [
            "Sanar dúvidas profundas sobre o produto ou serviço.",
            "Demonstrar autoridade e conhecimento técnico.",
            "Construir confiança e autoridade para a marca."
        ],
        instructions: [
            "Não enrole. Seja estratégico e consultivo, mas breve.",
            "Responda a dúvida técnica de forma simples.",
            "Mostre autoridade sem palestrar.",
            "Conecte a dor do cliente com a solução e avance para o próximo passo.",
            "🚫 LIMITE: Máximo 3 frases curtas.",
            "⚠️ AO FECHAR VENDA: Peça Nome, E-mail e CPF."
        ]
    },
    SUPPORT: {
        role: "Agente de Suporte e Sucesso",
        objectives: [
            "Resolver problemas e reclamações rapidamente.",
            "Garantir a satisfação do cliente no pós-venda.",
            "Coletar feedbacks e sugestões."
        ],
        instructions: [
            "Seja extremamente empático.",
            "Reconheça o problema do cliente antes de propor a solução.",
            "Mantenha a calma mesmo em situações de reclamação.",
            "Garanta que o cliente se sinta ouvido e bem atendido."
        ]
    }
};

export function getSkillPrompt(roleName: string): string {
    const role = roleName.toUpperCase();
    const skill = SpecialistSkills[role] || SpecialistSkills.SUPPORT;

    return `
═══ SKILL ESPECIALISTA: ${skill.role} ═══
OBJETIVOS:
${skill.objectives.map(o => `- ${o}`).join('\n')}

DIRETRIZES DE ATUAÇÃO:
${skill.instructions.map(i => `- ${i}`).join('\n')}
`;
}

export function mapBotToSkill(bot: { name: string, businessType: string }): string | null {
    const searchString = `${bot.name} ${bot.businessType}`.toLowerCase();

    // Closer: foco em fechamento e vendas diretas
    if (searchString.includes('closer') || searchString.includes('venda') || searchString.includes('fechad') || searchString.includes('fechamento')) {
        return getSkillPrompt('CLOSER');
    }
    // Consultant: eventos, networking, B2B, consultoria, qualificação
    if (
        searchString.includes('consult') || searchString.includes('especialista') || searchString.includes('técnico') ||
        searchString.includes('evento') || searchString.includes('networking') || searchString.includes('negócio') ||
        searchString.includes('empresa') || searchString.includes('b2b') || searchString.includes('conexão') ||
        searchString.includes('promoção')
    ) {
        return getSkillPrompt('CONSULTANT');
    }
    // Support: suporte pós-venda, ajuda
    if (searchString.includes('suporte') || searchString.includes('ajuda') || searchString.includes('atendimento') || searchString.includes('sistema')) {
        return getSkillPrompt('SUPPORT');
    }

    return null;
}
