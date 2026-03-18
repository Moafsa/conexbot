# Código Completo - Arquivos Modificados para Agente Local

**Instrução:** Copie cada bloco de código abaixo e substitua o conteúdo do arquivo correspondente no seu projeto local. Depois rode `npx prisma migrate deploy` (ou aplique a migração SQL manualmente) e faça o build.

---

## 1. `src/services/engine/skills.ts`

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

O arquivo é grande. A única alteração é na função `getStagePrompt`. **Substitua** a função inteira (linhas ~137-162) por:

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

**Alterações pontuais:**

### 3a. Linha ~132 – ignorar pausa no simulador
Troque:
```typescript
            if ((conversation as any).pausedUntil && (conversation as any).pausedUntil > new Date()) {
```
por:
```typescript
            if (channel !== 'simulator' && (conversation as any).pausedUntil && (conversation as any).pausedUntil > new Date()) {
```

### 3b. Linha ~416 – phoneForAsaas e uso em createSubscription/createPaymentLink
Logo após `const chargeDescription = ...`, adicione:
```typescript
                                        const phoneForAsaas = (channel === 'simulator' && senderPhone === '11999999999')
                                            ? '11987654321'
                                            : senderPhone;
```
E troque `customerPhone: senderPhone` por `customerPhone: phoneForAsaas` nas chamadas de `createSubscriptionForBot` e `createPaymentLink`.

### 3c. Linha ~434 – tratamento de erro de validação
Troque:
```typescript
                                            toolResult = `ERRO ao gerar fatura no Asaas: ${payment.error}. Use a função chamar_humano...`;
```
por:
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

**Seção de pagamentos** (dentro do `if (bot.enablePayments)`). Substitua o bloco inteiro por:

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
✅ CERTO: Só chame gerar_fatura quando tiver nome, email E CPF coletados na conversa.`);
```

---

## 5. `src/services/payment/asaas.ts`

**Arquivo completo** (já com todas as correções):

```typescript
import prisma from '@/lib/prisma';

const ASAAS_PROD = 'https://api.asaas.com/v3';
const ASAAS_SANDBOX = 'https://api-sandbox.asaas.com/v3';

function getAsaasBase() {
    return process.env.ASAAS_MODE === 'production' ? ASAAS_PROD : ASAAS_SANDBOX;
}

async function getHeaders(customKey?: string): Promise<Record<string, string>> {
    let key = customKey;
    
    if (!key) {
        const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        key = globalConfig?.asaasApiKey || process.env.ASAAS_API_KEY;
    }

    if (!key) throw new Error('ASAAS_API_KEY not configured');
    
    return {
        'Content-Type': 'application/json',
        'access_token': key,
    };
}

async function asaasFetch(path: string, options: RequestInit, customKey?: string) {
    console.log(`[Asaas] Fetching ${path} (Method: ${options.method || 'GET'})`);
    let res = await fetch(`${ASAAS_PROD}${path}`, {
        ...options,
        headers: await getHeaders(customKey)
    });

    if (res.status === 401) {
        console.log(`[Asaas] Production key failed (401). Trying Sandbox fallback for ${path}...`);
        res = await fetch(`${ASAAS_SANDBOX}${path}`, {
            ...options,
            headers: await getHeaders(customKey)
        });
        if (!res.ok) {
            const errBody = await res.text();
            console.log(`[Asaas] Sandbox response ${res.status} for ${path}:`, errBody.substring(0, 200));
        }
    }

    return res;
}

const PLAN_INTERVAL_MAP: Record<string, string> = {
    'MONTHLY': 'MONTHLY',
    'QUARTERLY': 'QUARTERLY',
    'SEMIANNUAL': 'SEMIANNUALLY',
    'YEARLY': 'YEARLY',
};

/** Asaas exige CPF/CNPJ apenas com dígitos (sem pontos, traços, barras). */
function normalizeCpfCnpj(value: string | undefined): string {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/\D/g, '');
}

export const AsaasService = {
    async createCustomer(data: { name: string; email: string; cpfCnpj: string }) {
        try {
            const body: any = {
                name: data.name,
                email: data.email,
            };
            if (data.cpfCnpj && data.cpfCnpj !== '00000000000' && data.cpfCnpj.trim() !== '') {
                body.cpfCnpj = normalizeCpfCnpj(data.cpfCnpj);
            }

            const res = await asaasFetch('/customers', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Asaas createCustomer error:', JSON.stringify(error, null, 2));
                throw new Error(error.errors?.[0]?.description || 'Failed to create customer');
            }

            return await res.json();
        } catch (error: any) {
            if (error.message === 'ASAAS_API_KEY not configured') {
                console.warn('ASAAS_API_KEY missing, returning mock customer');
                return { id: `cus_mock_${Date.now()}`, ...data };
            }
            throw error;
        }
    },

    async createSubscription(customerId: string, planId: string, value: number, interval: string = 'MONTHLY') {
        try {
            const nextDueDate = new Date();
            
            const res = await asaasFetch('/subscriptions', {
                method: 'POST',
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'UNDEFINED',
                    value,
                    nextDueDate: nextDueDate.toISOString().split('T')[0],
                    cycle: PLAN_INTERVAL_MAP[interval] || 'MONTHLY',
                    description: `Conext Bot - Assinatura`,
                    externalReference: customerId,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Asaas createSubscription error:', error);
                throw new Error(error.errors?.[0]?.description || 'Failed to create subscription');
            }

            const subscription = await res.json();

            const paymentRes = await asaasFetch(`/payments?subscription=${subscription.id}`, {
                method: 'GET'
            });

            let finalInvoiceUrl = '';
            let paymentId = '';
            let amount = value;
            if (paymentRes.ok) {
                const payments = await paymentRes.json();
                if (payments.data && payments.data.length > 0) {
                    finalInvoiceUrl = payments.data[0].invoiceUrl || payments.data[0].bankSlipUrl || '';
                    paymentId = payments.data[0].id;
                    amount = payments.data[0].value;
                }
            }

            return {
                id: subscription.id,
                status: subscription.status,
                invoiceUrl: finalInvoiceUrl || `/billing/success?gateway=asaas&id=${subscription.id}`,
                paymentId,
                amount
            };
        } catch (error: any) {
             if (error.message === 'ASAAS_API_KEY not configured') {
                return {
                    id: `sub_mock_${Date.now()}`,
                    status: 'PENDING',
                    invoiceUrl: `/billing/success?gateway=asaas&status=pending`,
                };
            }
            throw error;
        }
    },

    async cancelSubscription(subscriptionId: string) {
        try {
            const res = await asaasFetch(`/subscriptions/${subscriptionId}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                console.error(`[Asaas] Error canceling subscription ${subscriptionId}`);
            }
            return res.ok;
        } catch (error) {
            console.error(`[Asaas] Exception canceling subscription ${subscriptionId}:`, error);
            return false;
        }
    },

    async cancelPayment(paymentId: string) {
        try {
            const res = await asaasFetch(`/payments/${paymentId}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                console.error(`[Asaas] Error canceling payment ${paymentId}`);
            }
            return res.ok;
        } catch (error) {
            console.error(`[Asaas] Exception canceling payment ${paymentId}:`, error);
            return false;
        }
    },

    async receivePaymentInCash(paymentId: string) {
        try {
            const res = await asaasFetch(`/payments/${paymentId}/receiveInCash`, {
                method: 'POST',
                body: JSON.stringify({
                    paymentDate: new Date().toISOString().split('T')[0],
                    notifyCustomer: false
                })
            });
            if (!res.ok) {
                console.error(`[Asaas] Error receiving payment in cash ${paymentId}`);
                return false;
            }
            return true;
        } catch (error) {
            console.error(`[Asaas] Exception receiving payment in cash ${paymentId}:`, error);
            return false;
        }
    },

    async createPaymentLink(params: {
        apiKey: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        customerCpfCnpj?: string;
        amount: number;
        description: string;
        splits?: Array<{
            walletId: string;
            fixedValue?: number;
            percentualValue?: number;
        }>;
    }): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
        try {
            const customerBody: any = {
                name: params.customerName,
                email: params.customerEmail,
                mobilePhone: params.customerPhone,
            };
            if (params.customerCpfCnpj && params.customerCpfCnpj.trim() !== '') {
                customerBody.cpfCnpj = normalizeCpfCnpj(params.customerCpfCnpj);
            }

            const customerRes = await asaasFetch('/customers', {
                method: 'POST',
                body: JSON.stringify(customerBody),
            }, params.apiKey);

            let customerId: string;
            if (customerRes.ok) {
                const customer = await customerRes.json();
                customerId = customer.id;
            } else {
                if (customerRes.status === 400) {
                    try {
                        const errData = await customerRes.json();
                        const msg = errData.errors?.[0]?.description || 'Dados do cliente inválidos';
                        return { success: false, error: msg };
                    } catch {
                        return { success: false, error: 'Dados do cliente inválidos. Verifique nome, email, CPF e telefone.' };
                    }
                }
                const searchRes = await asaasFetch(
                    `/customers?email=${encodeURIComponent(params.customerEmail)}`,
                    { method: 'GET' },
                    params.apiKey
                );

                if (!searchRes.ok) {
                    return { success: false, error: 'Failed to create/find customer' };
                }

                const searchData = await searchRes.json();
                if (!searchData.data || searchData.data.length === 0) {
                    return { success: false, error: 'Customer creation failed' };
                }
                customerId = searchData.data[0].id;
            }

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            const paymentRes = await asaasFetch('/payments', {
                method: 'POST',
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'UNDEFINED',
                    value: params.amount / 100,
                    dueDate: dueDate.toISOString().split('T')[0],
                    description: params.description,
                    split: params.splits,
                }),
            }, params.apiKey);

            if (!paymentRes.ok) {
                if (!params.apiKey || params.apiKey === 'mock_key') {
                    console.log('[Asaas] Using Mock Payment for Dev');
                    return {
                        success: true,
                        url: `https://sandbox.asaas.com/money/pay/mock-${Date.now()}`
                    };
                }

                const error = await paymentRes.json();
                console.error('[Asaas] Payment creation error:', error);
                return {
                    success: false,
                    error: error.errors?.[0]?.description || 'Payment creation failed',
                };
            }

            const payment = await paymentRes.json();
            return {
                success: true,
                id: payment.id,
                url: payment.invoiceUrl || payment.bankSlipUrl,
            };
        } catch (error) {
            console.error('[Asaas] createPaymentLink error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },

    async createSubscriptionForBot(params: {
        apiKey: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        customerCpfCnpj?: string;
        value: number;
        description: string;
        cycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        splits?: Array<{
            walletId: string;
            fixedValue?: number;
            percentualValue?: number;
        }>;
    }): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
        try {
            const customerBody: any = {
                name: params.customerName,
                email: params.customerEmail,
                mobilePhone: params.customerPhone,
            };
            if (params.customerCpfCnpj && params.customerCpfCnpj.trim() !== '') {
                customerBody.cpfCnpj = normalizeCpfCnpj(params.customerCpfCnpj);
            }

            const customerRes = await asaasFetch('/customers', {
                method: 'POST',
                body: JSON.stringify(customerBody),
            }, params.apiKey);

            let customerId: string;
            if (customerRes.ok) {
                const customer = await customerRes.json();
                customerId = customer.id;
            } else {
                if (customerRes.status === 400) {
                    try {
                        const errData = await customerRes.json();
                        return { success: false, error: errData.errors?.[0]?.description || 'Dados do cliente inválidos' };
                    } catch {
                        return { success: false, error: 'Dados do cliente inválidos' };
                    }
                }
                const searchRes = await asaasFetch(`/customers?email=${encodeURIComponent(params.customerEmail)}`, { method: 'GET' }, params.apiKey);
                const searchData = await searchRes.json();
                customerId = searchData.data?.[0]?.id;
            }

            if (!customerId) return { success: false, error: 'Customer creation/lookup failed' };

            const nextDueDate = new Date();
            
            const subRes = await asaasFetch('/subscriptions', {
                method: 'POST',
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'UNDEFINED',
                    value: params.value,
                    nextDueDate: nextDueDate.toISOString().split('T')[0],
                    cycle: PLAN_INTERVAL_MAP[params.cycle] || params.cycle,
                    description: params.description,
                    split: params.splits,
                }),
            }, params.apiKey);

            if (!subRes.ok) {
                const error = await subRes.json();
                return { success: false, error: error.errors?.[0]?.description || 'Subscription creation failed' };
            }

            const subscription = await subRes.json();
            
            const paymentRes = await asaasFetch(`/payments?subscription=${subscription.id}`, { method: 'GET' }, params.apiKey);
            let finalUrl = subscription.invoiceUrl || subscription.bankSlipUrl;
            if (paymentRes.ok) {
                const payments = await paymentRes.json();
                if (payments.data && payments.data.length > 0) {
                    finalUrl = payments.data[0].invoiceUrl || payments.data[0].bankSlipUrl || finalUrl;
                }
            }

            return {
                success: true,
                id: subscription.id,
                url: finalUrl,
            };
        } catch (error) {
            console.error('[Asaas] createSubscriptionForBot error:', error);
            return { success: false, error: 'System error' };
        }
    }
};
```

---

## 6. `prisma/schema.prisma`

**Garantir que existam:**

- **Contact:** `eventDate`, `assignedBotId`, `isBlocked`
- **Conversation:** `pausedUntil`
- **Message:** `tool_call_id`, `tool_calls`

Exemplo do trecho relevante:

```prisma
model Contact {
  ...
  eventDate     DateTime?
  assignedBotId String?
  isBlocked     Boolean      @default(false)
  ...
}

model Conversation {
  ...
  pausedUntil DateTime?
  ...
}

model Message {
  ...
  tool_call_id   String?
  tool_calls     Json?
  ...
}
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

## Resumo das alterações

| Arquivo | O que foi alterado |
|---------|--------------------|
| `skills.ts` | Keywords (evento, networking, negócio, promoção), regras de fechamento e chamar_humano |
| `supervisor.ts` | Estágios em português (NOVO, EM ATENDIMENTO, APRESENTAÇÃO, NEGOCIAÇÃO, GANHO) |
| `processor.ts` | Ignorar pausa no simulador, phoneForAsaas 11987654321, tratamento de erro de validação |
| `prompts.ts` | Regra de só gerar_fatura com nome+email+CPF, não perguntar cartão/Pix |
| `asaas.ts` | URL sandbox, normalizeCpfCnpj, retorno de erro 400 real |
| `schema.prisma` | pausedUntil, isBlocked, tool_call_id, tool_calls |
| Migração | Colunas novas no banco |

---

## Comandos após aplicar

```bash
npx prisma migrate deploy
# ou, se a migração não existir:
psql $DATABASE_URL -f prisma/migrations/20260317190000_add_message_tool_columns/migration.sql

npm run build
# ou
docker compose build app && docker compose up -d app
```
