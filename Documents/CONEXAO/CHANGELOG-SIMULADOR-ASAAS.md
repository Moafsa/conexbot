# Changelog: Correções Simulador, Asaas e Skills

Resumo das alterações feitas para manter em futuras atualizações.

---

## Arquivos alterados

### 1. `src/services/engine/skills.ts`
- **CLOSER**: Instruções de fechamento (pedir Nome, E-mail, CPF; só gerar fatura quando tiver os 3; chamar_humano se Asaas não configurado)
- **CONSULTANT**: Mesma regra ao fechar venda
- **mapBotToSkill**: Novos keywords (evento, networking, negócio, promoção → CONSULTANT)

### 2. `src/services/engine/supervisor.ts`
- **getStagePrompt**: Estágios em português (NOVO, EM ATENDIMENTO, APRESENTAÇÃO, NEGOCIAÇÃO, GANHO)

### 3. `src/services/engine/processor.ts`
- **Pausa no simulador**: `channel !== 'simulator'` — no simulador ignora pausa
- **gerar_fatura sem Asaas**: Instrui chamar_humano
- **gerar_fatura erro**: Se validação (celular, CPF inválido) → pedir correção; senão → chamar_humano
- **phoneForAsaas**: Simulador com 11999999999 → usa 11987654321 (Asaas rejeita 11999999999)
- **pausedUntil**: Removido `as any` (coluna existe no schema)

### 4. `src/services/engine/prompts.ts`
- **Pagamentos**: Regra "só gerar fatura quando tiver os 3 dados somados"; não perguntar cartão ou Pix; exemplos de fechamento

### 5. `src/services/payment/asaas.ts`
- **ASAAS_SANDBOX**: `https://api-sandbox.asaas.com/v3` (era sandbox.asaas.com/api/v3)
- **normalizeCpfCnpj()**: CPF/CNPJ só dígitos (Asaas exige)
- **Erro 400**: Retorna erro real do Asaas (invalid_mobilePhone, CPF inválido, etc.)
- **Log**: Quando Sandbox retorna erro, loga o body

### 6. `prisma/schema.prisma`
- **Conversation**: Campo `pausedUntil DateTime?`
- **Contact**: Campo `isBlocked Boolean @default(false)`

### 7. `prisma/migrations/20260317190000_add_message_tool_columns/migration.sql`
```sql
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "tool_call_id" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "tool_calls" JSONB;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "assignedBotId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "pausedUntil" TIMESTAMP(3);
```

---

## Como aplicar na sua máquina

1. **Faça backup** do seu código atual.
2. **Copie os arquivos** listados acima do servidor para sua máquina (ou aplique os diffs manualmente).
3. **Rode as migrações** se o banco ainda não tiver as colunas:
   ```bash
   npx prisma migrate deploy
   ```
4. **Rebuild** do container:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.production.yml build app
   docker compose -f docker-compose.yml -f docker-compose.production.yml up -d app
   ```

---

## Resumo por problema resolvido

| Problema | Solução |
|----------|---------|
| "Sem resposta do processador" | Colunas Message (tool_call_id, tool_calls) e Contact (eventDate, assignedBotId, isBlocked) |
| Skills não aplicadas | mapBotToSkill com mais keywords (evento, networking, etc.) |
| Estágios CRM em PT ignorados | getStagePrompt com NOVO, EM ATENDIMENTO, etc. |
| Bot não pedia Nome/CPF/Email | Prompts e skills com regra "3 dados somados" |
| Asaas não configurado → chamar humano | toolResult instrui chamar_humano |
| URL Sandbox errada | api-sandbox.asaas.com/v3 |
| CPF formatado rejeitado | normalizeCpfCnpj (só dígitos) |
| Celular 11999999999 rejeitado | phoneForAsaas = 11987654321 no simulador |
| Erro validação → chamar humano | Erros de celular/CPF → pedir correção |
| Simulador pausado para sempre | channel === 'simulator' ignora pausa |
| chamar_humano falhava | Coluna Conversation.pausedUntil |
