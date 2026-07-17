# WhatsApp API Oficial (Cloud API) via Embedded Signup — Guia de Configuração

Este guia cobre o que **só você** consegue fazer (dentro do painel da Meta), para que o botão
"Conectar com Facebook" no Conextbot funcione de ponta a ponta para os números dos seus clientes.

O código já está pronto (troca de token, registro do número, assinatura do webhook, envio e
recebimento de mensagens). O que falta é a configuração do lado da Meta.

---

## 1. Pré-requisitos

- Você já tem um **App da Meta** conectado (usado hoje para tráfego pago/Meta Ads). **Vamos reutilizá-lo** —
  não precisa criar um novo.
- Uma conta de **Gerenciador de Negócios (Business Manager)** seu, verificada (recomendado, mas não
  bloqueante para testes).
- Acesso de administrador ao App em [developers.facebook.com](https://developers.facebook.com).

---

## 2. Adicionar o produto WhatsApp ao App existente

1. Acesse [developers.facebook.com/apps](https://developers.facebook.com/apps) e abra o App que já
   usa para o Meta Ads.
2. No menu lateral, clique em **Adicionar Produto** → localize **WhatsApp** → **Configurar**.
3. Isso habilita as APIs de WhatsApp Business dentro do mesmo App (mesmo App ID/Secret que você já
   tem cadastrado no Conextbot).

---

## 3. Criar a "Configuration" do Embedded Signup (gera o Config ID)

Esse é o passo que faltava para o popup funcionar — sem ele, o botão de conectar não sabe qual
fluxo/permissões oferecer ao cliente.

1. Dentro do App, vá em **WhatsApp → Configuração da API** (ou **App Settings → Facebook Login for
   Business → Configurações**, dependendo da versão do painel).
2. Clique em **Criar Configuration** (Create Configuration).
3. Selecione o produto **WhatsApp Business** e o tipo de fluxo **Embedded Signup**.
4. Defina as permissões solicitadas: `whatsapp_business_management` e `whatsapp_business_messaging`
   (já vêm marcadas por padrão na maioria dos casos).
5. Salve. A Meta vai gerar um **Configuration ID** (um número, ex: `987654321012345`).
6. Copie esse ID.

---

## 4. Colar as credenciais no Conextbot

No painel administrativo do Conextbot (**Admin → Configurações → Meta / Facebook Global**):

- **Meta App ID**: já preenchido (o mesmo do Ads).
- **Meta App Secret**: já preenchido.
- **Verify Token**: qualquer string secreta sua, ex. `CONEXT_META_VERIFY` (usada no passo 5).
- **WhatsApp Embedded Signup Config ID**: cole o ID copiado no passo 3.

Salve. O botão "Conectar com Facebook" na tela de conexão de cada agente passa a funcionar assim
que o `configId` estiver preenchido.

---

## 5. Configurar o Webhook a nível de App (uma vez só)

Isso é diferente da assinatura por-cliente (que o Conextbot já faz automaticamente a cada conexão).
Este passo configura **para onde a Meta manda tudo**, globalmente, para este App:

1. No painel do App, vá em **WhatsApp → Configuração** → seção **Webhook**.
2. **Callback URL**: `https://SEU-DOMINIO/api/webhooks/meta`
3. **Verify Token**: o mesmo valor que você colocou no campo "Verify Token" acima.
4. Clique em **Verificar e Salvar**.
5. Na lista de campos do webhook, marque **messages** (o Conextbot só processa esse campo por
   enquanto).

Depois disso, toda vez que um cliente conectar um número pelo popup, o sistema assina
automaticamente aquele número (`WABA`) para mandar eventos para esse mesmo webhook — você não
precisa repetir esse passo por cliente.

---

## 6. Modo Live e permissões avançadas (importante para múltiplos clientes)

Por padrão, um App em **modo de Desenvolvimento** só consegue operar com números/negócios que
**você mesmo** administra (os "testers" do App). Como você é uma agência conectando **números de
terceiros (seus clientes)**, duas coisas precisam estar certas:

1. **App em modo Live** (App Review aprovado, ou a permissão em "Standard Access"). Sem isso, o
   popup de login vai funcionar apenas com contas de teste, não com clientes reais.
2. Solicitar **Advanced Access** para `whatsapp_business_management` e `whatsapp_business_messaging`
   via **App Review**, explicando o caso de uso ("gerenciamos WhatsApp Business em nome de
   clientes/agência"). Isso costuma ser aprovado rápido quando o App já está vinculado a um
   Business Manager verificado.

Sem o App Review aprovado, o fluxo funciona perfeitamente para testar com o **seu próprio** número,
mas pode ser bloqueado ao tentar conectar o número de um cliente fora do seu Business Manager.

---

## 7. O que o sistema já faz sozinho (não precisa mexer)

A cada clique em "Conectar com Facebook":

1. Abre o popup oficial da Meta (Embedded Signup) — cliente faz login, escolhe/cria o negócio e o
   número, confirma por SMS/ligação se pedido.
2. O Conextbot troca o código por um token, converte para **token de longa duração** (~60 dias).
3. **Registra o número** na Cloud API com um PIN gerado automaticamente (2FA) — nenhuma ação do
   cliente.
4. **Assina o app** nos eventos da WABA do cliente (para o webhook funcionar).
5. Salva tudo de forma isolada por bot/tenant e mostra "Conectado com sucesso".

A partir daí, as mensagens recebidas chegam pelo `/api/webhooks/meta` e as respostas da IA são
enviadas de volta automaticamente pela Cloud API (sem depender do Uzapi/QR Code).

---

## 8. Erros comuns e o que significam

| Mensagem exibida | Causa provável |
|---|---|
| "Este número já está registrado em outra conta..." | O número já está ativo em outro app oficial, no WhatsApp Business App comum, ou on-premise. É preciso migrar/desvincular antes. |
| "Sessão/token da Meta expirado" | O cliente demorou demais entre o login e a confirmação, ou revogou o acesso. Basta clicar em conectar novamente. |
| "Permissões insuficientes" | App Review ainda não aprovado para `whatsapp_business_management`/`whatsapp_business_messaging`, ou App não está em modo Live. |
| "Conexão automática ainda não configurada" | Falta preencher o Config ID no Admin → Configurações. |

---

## 9. Testando

1. Use primeiro um número seu (não crítico) para validar o fluxo completo.
2. Depois de conectar, envie uma mensagem de teste pelo WhatsApp para o número conectado.
3. Confirme no CRM do agente que a mensagem chegou e que a resposta da IA foi entregue.
4. Só depois disso migre números de clientes reais.
