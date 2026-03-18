# Patch para Agente Local - Correções Simulador e Asaas

**Instrução para o agente local:** Aplique as alterações abaixo nos arquivos indicados. Cada seção contém o caminho do arquivo e o conteúdo completo ou as alterações necessárias.

---

## 1. `src/services/engine/skills.ts`

**Substituir o arquivo inteiro por:**

```typescript

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
            "Seja direto e persuasivo.",
            "Use escassez e urgência (ex: 'últimas vagas', 'valor promocional por tempo limitado').",
            "Sempre termine as respostas com uma pergunta que leve ao fechamento (CTA).",
            "Valide a decisão do cliente como sendo o melhor passo para o negócio dele.",
            "⚠️ FECHAMENTO: Peça Nome, E-mail e CPF. Só chame gerar_fatura quando tiver os 3 dados somados. Não pergunte cartão ou Pix.",
            "⚠️ SEM ASAAS: Se a integração de pagamentos não estiver configurada, use a função chamar_humano para conectar o cliente com um atendente."
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
            "Seja didático e paciente.",
            "Use linguagem técnica mas acessível.",
            "Explique o 'porquê' por trás de cada funcionalidade.",
            "Se o cliente tiver um desafio específico, mostre como a solução se adapta a ele.",
            "⚠️ AO FECHAR VENDA: Peça Nome, E-mail e CPF. Só chame gerar_fatura quando tiver os 3 somados. Se pagamentos não configurados, use chamar_humano."
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

    if (searchString.includes('closer') || searchString.includes('venda') || searchString.includes('fechad') || searchString.includes('fechamento')) {
        return getSkillPrompt('CLOSER');
    }
    if (
        searchString.includes('consult') || searchString.includes('especialista') || searchString.includes('técnico') ||
        searchString.includes('evento') || searchString.includes('networking') || searchString.includes('negócio') ||
        searchString.includes('empresa') || searchString.includes('b2b') || searchString.includes('conexão') ||
        searchString.includes('promoção')
    ) {
        return getSkillPrompt('CONSULTANT');
    }
    if (searchString.includes('suporte') || searchString.includes('ajuda') || searchString.includes('atendimento') || searchString.includes('sistema')) {
        return getSkillPrompt('SUPPORT');
    }

    return null;
}
```

---

## 2. `src/services/engine/supervisor.ts`

**Substituir a função `getStagePrompt` (linhas ~137-152) por:**

```typescript
    getStagePrompt(stageName: string): string {
        const name = (stageName || '').toUpperCase().trim();
        if (name === 'LEAD' || name === 'AWARENESS' || name === 'NOVO') {
            return "FOCO: QUALIFICAÇÃO. Identifique as necessidades básicas e quem é o cliente. Pergunte sobre a empresa ou o que busca.";
        }
        if (name === 'INTEREST' || name === 'INTERESSADO' || name === 'EM ATENDIMENTO' || name === 'EM_ATENDIMENTO') {
            return "FOCO: Apresentação de Solução. Mostre como o produto resolve a dor dele. Conecte a necessidade com a oferta.";
        }
        if (name === 'APRESENTAÇÃO' || name === 'APRESENTACAO' || name === 'PROPOSAL') {
            return "FOCO: Apresentação de proposta. Destaque benefícios e valor. Responda dúvidas sobre preço e condições.";
        }
        if (name === 'NEGOCIAÇÃO' || name === 'NEGOCIACAO' || name === 'NEGOTIATION') {
            return "FOCO: Negociação. Supere objeções. Ofereça alternativas (parcelamento, descontos se aplicável). Leve ao fechamento.";
        }
        if (name === 'DECISION' || name === 'DECISÃO' || name === 'FECHAMENTO' || name === 'GANHO' || name === 'CUSTOMER') {
            return "FOCO: FECHAMENTO. Seja direto e encoraje o pagamento/contratação. Confirme a decisão e parabenize.";
        }
        return `FOCO: Atendimento prestativo adequado ao estágio ${stageName}.`;
    }
```

---

## 3. `src/services/engine/processor.ts`

**Alterações (busque e substitua):**

### 3a. Pausa no simulador (linha ~132)
**De:**
```typescript
            if ((conversation as any).pausedUntil && (conversation as any).pausedUntil > new Date()) {
```
**Para:**
```typescript
            if (channel !== 'simulator' && (conversation as any).pausedUntil && (conversation as any).pausedUntil > new Date()) {
```

### 3b. chamar_humano - data: { pausedUntil } (linha ~387)
**De:** `data: { pausedUntil } as any`  
**Para:** `data: { pausedUntil }`

### 3c. gerar_fatura - phoneForAsaas e erros de validação (após `const chargeDescription`)
**Adicionar antes do `if ((matchedProduct as any).type === 'RECURRING')`:**
```typescript
                                        const phoneForAsaas = (channel === 'simulator' && senderPhone === '11999999999')
                                            ? '11987654321'
                                            : senderPhone;
```

**Trocar** `customerPhone: senderPhone` **por** `customerPhone: phoneForAsaas` nas duas chamadas (createSubscriptionForBot e createPaymentLink).

### 3d. Tratamento de erro do payment (no `else` do `if (payment.success)`)
**De:**
```typescript
                                            toolResult = `ERRO ao gerar fatura no Asaas: ${payment.error}. Use a função chamar_humano com motivo 'Falha técnica no pagamento' para conectar o cliente com um atendente humano.`;
```
**Para:**
```typescript
                                            const err = (payment.error || '').toLowerCase();
                                            if (err.includes('celular') || err.includes('mobilephone') || err.includes('telefone') || err.includes('cpf') || err.includes('cnpj') || err.includes('inválido') || err.includes('invalid')) {
                                                toolResult = `ERRO de validação: ${payment.error}. Peça ao cliente que informe os dados corretos (não use chamar_humano).`;
                                            } else {
                                                toolResult = `ERRO ao gerar fatura no Asaas: ${payment.error}. Use a função chamar_humano com motivo 'Falha técnica no pagamento' para conectar o cliente com um atendente humano.`;
                                            }
```

---

## 4. `src/services/engine/prompts.ts`

**Substituir a seção "Payment instructions" (dentro do `if (bot.enablePayments)`) por:**

```typescript
        sections.push(`═══ PAGAMENTOS HABILITADOS ═══

Quando o cliente MOSTRAR INTENÇÃO DE COMPRA (ex: "quero", "vou levar", "fechado", "sim, quero reservar"):
1. Peça Nome Completo, E-mail e CPF (ou CNPJ). O cliente pode enviar os 3 de uma vez ou um por vez — tanto faz.
2. REGRA CRÍTICA: Só chame "gerar_fatura" quando você tiver os 3 dados SOMADOS (nome + email + cpf). Se faltar um, peça o que falta e NÃO gere a fatura.
3. NÃO pergunte "prefere cartão ou Pix?" — o link do Asaas já oferece as duas opções.
4. SEM ASAAS: Se gerar_fatura retornar que a integração não está configurada, use chamar_humano.
5. ERRO AO GERAR: Se houver falha técnica, use chamar_humano.

- **Promoções**: Se o produto tiver salePrice, informe esse valor.
- **Cupons**: Use o parâmetro "cupom_desconto" na ferramenta "gerar_fatura" se aplicável.

EXEMPLOS:
❌ ERRADO: Chamar gerar_fatura tendo só nome e email (falta CPF).
✅ CERTO: Só chamar gerar_fatura quando tiver nome, email E CPF coletados na conversa.`);
```

---

## 5. `src/services/payment/asaas.ts`

### 5a. URL Sandbox (linha 4)
**De:** `const ASAAS_SANDBOX = 'https://sandbox.asaas.com/api/v3';`  
**Para:** `const ASAAS_SANDBOX = 'https://api-sandbox.asaas.com/v3';`

### 5b. Após o bloco `if (res.status === 401)` no asaasFetch, adicionar:
```typescript
        if (!res.ok) {
            const errBody = await res.text();
            console.log(`[Asaas] Sandbox response ${res.status} for ${path}:`, errBody.substring(0, 200));
        }
```

### 5c. Adicionar função normalizeCpfCnpj (após PLAN_INTERVAL_MAP):
```typescript
/** Asaas exige CPF/CNPJ apenas com dígitos (sem pontos, traços, barras). */
function normalizeCpfCnpj(value: string | undefined): string {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/\D/g, '');
}
```

### 5d. Em createCustomer: `body.cpfCnpj = normalizeCpfCnpj(data.cpfCnpj);`

### 5e. Em createPaymentLink: antes do `else` (tentar search), adicionar:
```typescript
                if (customerRes.status === 400) {
                    try {
                        const errData = await customerRes.json();
                        const msg = errData.errors?.[0]?.description || 'Dados do cliente inválidos';
                        return { success: false, error: msg };
                    } catch {
                        return { success: false, error: 'Dados do cliente inválidos. Verifique nome, email, CPF e telefone.' };
                    }
                }
```
E usar `normalizeCpfCnpj(params.customerCpfCnpj)` no customerBody.cpfCnpj.

### 5f. Em createSubscriptionForBot: mesmo bloco 400 e normalizeCpfCnpj.

---

## 6. `prisma/schema.prisma`

**No model Contact**, adicionar:
```
  isBlocked     Boolean      @default(false)
```

**No model Conversation**, adicionar:
```
  pausedUntil DateTime?
```

**No model Message**, garantir que existam:
```
  tool_call_id   String?
  tool_calls     Json?
```

---

## 7. Migração SQL

**Criar** `prisma/migrations/20260317190000_add_message_tool_columns/migration.sql`:

```sql
-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "tool_call_id" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "tool_calls" JSONB;

-- AlterTable Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "assignedBotId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN DEFAULT false;

-- AlterTable Conversation
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "pausedUntil" TIMESTAMP(3);
```

---

## Após aplicar

1. `npx prisma migrate deploy` (ou aplicar o SQL manualmente se o migrate não rodar)
2. `npm run build` ou rebuild do Docker
3. Reiniciar o container/app
