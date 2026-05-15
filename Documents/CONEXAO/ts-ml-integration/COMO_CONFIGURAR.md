# 📋 Como Configurar o Plugin Mercado Livre Integration

## 🚀 Passo a Passo Completo

### 1. Acessar a Página de Configurações

1. No painel WordPress, vá em **Mercado Livre** no menu lateral
2. Ou acesse: **Mercado Livre > Configurações**

### 2. Obter Credenciais da API do Mercado Livre

Antes de começar, você precisa criar uma aplicação no Mercado Livre Developers:

#### 2.1. Criar Aplicação no Mercado Livre

1. Acesse: https://developers.mercadolivre.com.br/
2. Faça login com sua conta do Mercado Livre
3. Clique em **"Criar nova aplicação"**
4. Preencha os dados:
   - **Nome da aplicação**: Ex: "Minha Loja WooCommerce"
   - **Tipo de aplicação**: Selecione "Marketplace"
   - **URL de redirecionamento**: 
     ```
     http://localhost:8089/wp-admin/admin.php?page=ts-ml-settings&action=oauth_callback&account_id=1
     ```
     ⚠️ **IMPORTANTE**: Substitua `localhost:8089` pelo seu domínio real quando for para produção
5. Clique em **"Criar aplicação"**
6. Anote o **App ID** e **Secret Key** que serão gerados

#### 2.2. Configurar Credenciais no Plugin

1. Na página de configurações do plugin, role até **"Credenciais da API do Mercado Livre"**
2. Cole o **App ID (Brasil)** no campo correspondente
3. Cole o **Secret Key (Brasil)** no campo correspondente
4. Clique em **"Salvar Credenciais"**

### 3. Adicionar Conta do Mercado Livre

1. Na seção **"Adicionar Nova Conta"**:
   - **Nome da Conta**: Digite um nome para identificar esta conta (ex: "Conta Principal")
   - **País**: Selecione o país (Brasil, Argentina, México, etc.)
2. Clique em **"Adicionar Conta"**

### 4. Conectar Conta via OAuth

1. Após adicionar a conta, você verá um botão **"Conectar Conta"**
2. Clique no botão
3. Você será redirecionado para o Mercado Livre para autorizar a aplicação
4. Faça login com sua conta do Mercado Livre
5. Autorize o acesso
6. Você será redirecionado de volta para o WordPress
7. A conta estará conectada! ✅

### 5. Configurar Sincronizações Automáticas

Na seção **"Configurações Avançadas"**, você pode configurar:

- ✅ **Sincronização Automática**: Ativa sincronização automática de produtos
- ✅ **Sincronização de Estoque**: Atualiza estoque automaticamente
- ✅ **Sincronização de Preços**: Atualiza preços automaticamente
- ✅ **Sincronização de Pedidos**: Importa pedidos automaticamente
- **Frequência de Sincronização**: Escolha entre:
  - A cada hora
  - Duas vezes por dia
  - Uma vez por dia

### 6. (Opcional) Configurar Integração com ChatGPT

Se quiser usar IA para responder mensagens automaticamente:

1. Marque **"Ativar respostas automáticas com IA"**
2. Cole sua **Chave API OpenAI** (obtenha em https://platform.openai.com/api-keys)
3. Salve as configurações

### 7. (Opcional) Ativar Modo Debug

Para depuração e logs detalhados:

1. Marque **"Ativar modo debug"**
2. Os logs serão salvos em: `wp-content/uploads/ts-ml-logs/`

## 📍 Localização no WordPress

- **Menu Principal**: Mercado Livre (ícone genérico no menu lateral)
- **Submenus**:
  - Configurações
  - Produtos
  - Pedidos
  - Mensagens
  - Relatórios

## ⚠️ Importante

1. **URL de Redirecionamento**: Certifique-se de configurar a URL correta no Mercado Livre Developers
2. **Múltiplas Contas**: Você pode adicionar várias contas do Mercado Livre
3. **Tokens**: Os tokens são renovados automaticamente quando expiram
4. **Primeira Sincronização**: Após conectar a conta, a primeira sincronização pode demorar alguns minutos

## 🔧 Resolução de Problemas

### Erro ao conectar conta
- Verifique se as credenciais (App ID e Secret Key) estão corretas
- Verifique se a URL de redirecionamento está configurada corretamente no Mercado Livre Developers

### Sincronização não funciona
- Verifique se a conta está conectada (tem token de acesso)
- Verifique se as sincronizações automáticas estão ativadas
- Ative o modo debug para ver logs detalhados

### Token expirado
- Os tokens são renovados automaticamente
- Se houver problemas, desconecte e reconecte a conta

## 📞 Suporte

Para mais informações sobre a API do Mercado Livre:
- Documentação: https://developers.mercadolivre.com.br/pt_br
- Suporte: https://developers.mercadolivre.com.br/pt_br/suporte
