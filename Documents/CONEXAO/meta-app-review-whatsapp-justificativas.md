# Justificativas de uso — App Review Meta (WhatsApp) — ConextBot

App: **CONEXTs** (App ID 993994016825158)
Caso de uso: **Connect with customers through WhatsApp**

Texto pronto para colar no campo "How does your app use this permission?" de cada permissão, no fluxo Actions → Go to App Review.

---

## 1. whatsapp_business_messaging

**Como usamos:**

O ConextBot é uma plataforma de automação de atendimento via WhatsApp para empresas clientes de uma agência de marketing digital. Usamos a permissão `whatsapp_business_messaging` para:

- Enviar e receber mensagens de texto, imagem, áudio e documento entre o número de WhatsApp Oficial (Cloud API) do cliente e os consumidores finais dele, através de um agente de IA que responde automaticamente dúvidas, tira pedidos e conduz o atendimento.
- Enviar mensagens de template pré-aprovadas para casos de utilidade fora da janela de 24 horas, como: notificação de nova entrega atribuída a um entregador, envio de link de acesso ao painel do entregador, e aviso de transbordo para um atendente humano quando a IA identifica que precisa de intervenção humana.
- Registrar e manter o número de telefone do cliente vinculado ao nosso app (webhook de mensagens), permitindo que o sistema receba e responda em tempo real.

**Jornada do usuário (passo a passo):**
1. O administrador da empresa cliente acessa o painel do ConextBot e clica em "Conectar WhatsApp Oficial".
2. É aberto o popup de Embedded Signup da Meta, onde o cliente faz login com a conta que administra o WhatsApp Business Account.
3. Após a conclusão, o ConextBot recebe o `code` de autorização, troca por um token e assina o número/WABA nos webhooks de mensagens.
4. A partir daí, mensagens recebidas dos consumidores finais chegam via webhook e são respondidas automaticamente pela IA, ou encaminhadas a um atendente humano quando necessário.

---

## 2. whatsapp_business_management

**Como usamos:**

Usamos `whatsapp_business_management` para gerenciar, em nome de cada cliente que conecta sua conta, os ativos da WhatsApp Business Platform necessários para o funcionamento do atendimento automatizado:

- Ler os números de telefone e WhatsApp Business Accounts (WABA) disponíveis após o Embedded Signup, para identificar qual número foi conectado.
- Inscrever nosso app nos eventos de webhook da WABA (`subscribed_apps`), para que as mensagens recebidas sejam entregues ao nosso sistema.
- Criar, listar e submeter para aprovação da Meta os modelos de mensagem (message templates) usados pelas notificações de utilidade do sistema (ex.: nova entrega atribuída, link de acesso do entregador, transbordo para atendimento humano).
- Consultar o status de qualidade e limites de mensagens do número conectado, para exibir esses dados ao cliente no painel.

**Jornada do usuário:** mesma do item anterior — via Embedded Signup, iniciado pelo próprio administrador da empresa cliente dentro do painel do ConextBot.

---

## 3. business_management

**Como usamos:**

O fluxo de Embedded Signup da Meta para WhatsApp exige acesso de leitura/escrita ao Business Manager do cliente para concluir a configuração — é um pré-requisito técnico do próprio fluxo oficial de onboarding documentado pela Meta, não uma funcionalidade extra que construímos por cima. Usamos `business_management` para:

- Ler os negócios (Business Manager) que o usuário administra, de forma a associar corretamente o WABA criado/selecionado durante o Embedded Signup ao Business Manager correto.
- Conceder ao nosso app de sistema (system user) acesso ao WABA recém-criado ou selecionado pelo cliente, como parte do fluxo de Embedded Signup.

Não usamos esta permissão para nenhuma finalidade fora do escopo do onboarding de WhatsApp — não criamos, editamos nem removemos outros ativos do Business Manager do cliente.

---

## 4. email

**Como usamos:**

Permissão básica retornada pelo login padrão do Facebook, usada apenas para identificar de forma amigável, no painel do ConextBot, qual administrador da empresa cliente concluiu a conexão do WhatsApp Oficial (ex.: exibir "Conectado por fulano@empresa.com"). Não enviamos e-mails nem usamos esse dado para marketing.

---

## 5. public_profile

**Como usamos:**

Permissão concedida automaticamente pelo login do Facebook, usada apenas para exibir o nome do administrador que autorizou a conexão dentro do fluxo de Embedded Signup, junto ao registro de qual conta concluiu a integração. Não é usada para nenhuma outra finalidade.

---

## Observações gerais (se o formulário pedir contexto do app)

- O ConextBot é uma plataforma multi-tenant (multi-cliente) usada por uma agência de marketing digital para automatizar o atendimento no WhatsApp de várias empresas clientes.
- Cada cliente conecta seu próprio número de WhatsApp Business via Embedded Signup — o app não acessa números que não foram explicitamente conectados por um administrador autorizado da respectiva empresa.
- O uso de IA generativa serve para responder dúvidas, tirar pedidos e qualificar leads; quando a IA não consegue resolver, a conversa é transferida para um atendente humano da própria empresa cliente.
