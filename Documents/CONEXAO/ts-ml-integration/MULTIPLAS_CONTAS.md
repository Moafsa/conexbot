# 🔄 Sistema de Múltiplas Contas - Mercado Livre Integration

## 📋 Visão Geral

O plugin **ToySport Mercado Livre Integration** suporta **múltiplas contas do Mercado Livre** simultaneamente. Isso permite que você:

- ✅ Gerencie várias lojas do Mercado Livre em um único WordPress
- ✅ Sincronize produtos para diferentes contas
- ✅ Gerencie pedidos de múltiplas contas
- ✅ Responda mensagens de diferentes contas
- ✅ Tenha relatórios separados por conta

## 🏗️ Como Funciona

### 1. Estrutura de Dados

Cada conta do Mercado Livre é armazenada na tabela `wp_ts_ml_accounts` com os seguintes campos:

- **`id`**: ID único da conta (chave primária)
- **`account_name`**: Nome da conta (ex: "Conta Principal", "Loja Online", "Conta Argentina")
- **`user_id`**: ID do usuário WordPress que criou a conta
- **`country`**: País da conta (BR, AR, MX, CL, CO)
- **`access_token`**: Token de acesso OAuth do Mercado Livre
- **`refresh_token`**: Token de renovação
- **`token_expires_at`**: Data de expiração do token
- **`is_active`**: Se a conta está ativa (1) ou inativa (0)
- **`created_at`**: Data de criação
- **`updated_at`**: Data da última atualização

### 2. Credenciais da API

As credenciais da API (App ID e Secret Key) são armazenadas como **opções do WordPress** por país:

- `ts_ml_app_id_BR` - App ID para Brasil
- `ts_ml_app_secret_BR` - Secret Key para Brasil
- `ts_ml_app_id_AR` - App ID para Argentina
- `ts_ml_app_secret_AR` - Secret Key para Argentina
- (e assim por diante para outros países)

**Importante:** As credenciais são **compartilhadas** entre todas as contas do mesmo país. Isso significa que:

- ✅ Você precisa configurar as credenciais **uma vez por país**
- ✅ Todas as contas do mesmo país usam as mesmas credenciais
- ✅ Cada conta precisa fazer seu próprio **OAuth** para obter tokens únicos

### 3. Fluxo de Configuração

#### Passo 1: Configurar Credenciais da API
1. Acesse **Configurações > Mercado Livre > Configurações**
2. Vá até a seção **"🔑 Passo 1: Credenciais da API"**
3. Preencha o **App ID** e **Secret Key** para o país desejado
4. Clique em **"Salvar Credenciais"**

#### Passo 2: Adicionar Conta
1. Na mesma página, vá até **"👤 Passo 2: Contas do Mercado Livre"**
2. Preencha o **Nome da Conta** (ex: "Conta Principal")
3. Selecione o **País**
4. Clique em **"Adicionar Conta"**

#### Passo 3: Conectar Conta (OAuth)
1. Após adicionar a conta, você verá um botão **"Conectar Conta"**
2. Clique no botão para iniciar o processo OAuth
3. Você será redirecionado para o Mercado Livre
4. Autorize a aplicação
5. Você será redirecionado de volta para o WordPress
6. A conta estará conectada e pronta para uso

### 4. Organização de Dados

#### Produtos Sincronizados
A tabela `wp_ts_ml_products` armazena a relação entre produtos WooCommerce e anúncios do Mercado Livre:

```sql
- account_id: ID da conta do Mercado Livre
- product_id: ID do produto WooCommerce
- ml_item_id: ID do item no Mercado Livre
- ml_listing_id: ID do anúncio no Mercado Livre
```

**Cada produto pode ser sincronizado com múltiplas contas**, criando anúncios diferentes em cada conta.

#### Pedidos
A tabela `wp_ts_ml_orders` armazena pedidos sincronizados:

```sql
- account_id: ID da conta do Mercado Livre
- order_id: ID do pedido WooCommerce
- ml_order_id: ID do pedido no Mercado Livre
```

Cada pedido está vinculado a **uma única conta**.

#### Mensagens
A tabela `wp_ts_ml_messages` armazena mensagens do Mercado Livre:

```sql
- account_id: ID da conta do Mercado Livre
- message_id: ID da mensagem no Mercado Livre
```

Cada mensagem está vinculada a **uma única conta**.

### 5. Seleção de Conta nas Páginas

Em todas as páginas do plugin (Produtos, Pedidos, Mensagens), você pode:

1. **Selecionar a conta** usando o dropdown no topo da página
2. **Filtrar dados** por conta específica
3. **Ver dados** apenas da conta selecionada

### 6. Sincronização

A sincronização funciona **por conta**:

- ✅ Cada conta sincroniza seus próprios produtos
- ✅ Cada conta sincroniza seus próprios pedidos
- ✅ Cada conta recebe suas próprias mensagens
- ✅ Cada conta tem seus próprios tokens OAuth

## 🔍 Verificando Contas Configuradas

### Na Página de Configurações
1. Acesse **WooCommerce > Mercado Livre > Configurações**
2. Veja todas as contas listadas na seção **"👤 Passo 2: Contas do Mercado Livre"**
3. Cada conta mostra:
   - Nome da conta
   - País
   - Status (Ativa/Inativa)
   - Status de conexão (Conectada/Não conectada)

### Debug Mode
Se o modo debug estiver ativado, você verá informações detalhadas sobre:
- Quantas contas existem na tabela
- Quais contas estão ativas
- Quais contas estão conectadas

## ⚠️ Problemas Comuns

### "Nenhuma conta configurada"
**Causas possíveis:**
1. A tabela `wp_ts_ml_accounts` não existe
   - **Solução:** Vá em Configurações e clique em "Criar Tabelas Agora"
2. Nenhuma conta foi adicionada ainda
   - **Solução:** Adicione uma conta na página de Configurações
3. Todas as contas estão inativas
   - **Solução:** Ative as contas na página de Configurações

### "Configure as credenciais da API primeiro"
**Causa:** As credenciais da API não foram configuradas para o país da conta.
**Solução:** Configure o App ID e Secret Key na seção "🔑 Passo 1: Credenciais da API"

### Conta não aparece após adicionar
**Causas possíveis:**
1. Erro ao salvar no banco de dados
   - **Solução:** Ative o modo debug para ver mensagens de erro detalhadas
2. Redirecionamento não funcionou
   - **Solução:** Recarregue a página manualmente (F5)

## 📝 Exemplo de Uso

### Cenário: Loja com 2 Contas

1. **Conta Principal (Brasil)**
   - Nome: "Conta Principal"
   - País: BR
   - App ID: `123456789`
   - Secret Key: `abc123...`

2. **Conta Argentina**
   - Nome: "Loja Argentina"
   - País: AR
   - App ID: `987654321`
   - Secret Key: `xyz789...`

**Como funciona:**
- Cada conta tem seus próprios tokens OAuth
- Produtos podem ser sincronizados para ambas as contas
- Pedidos são importados separadamente por conta
- Mensagens são gerenciadas por conta

## 🎯 Resumo

- ✅ **Múltiplas contas** são suportadas
- ✅ Cada conta tem seu próprio **token OAuth**
- ✅ Credenciais da API são **compartilhadas por país**
- ✅ Produtos podem ser sincronizados para **múltiplas contas**
- ✅ Dados são **organizados por conta** nas tabelas
- ✅ Interface permite **selecionar conta** em todas as páginas
