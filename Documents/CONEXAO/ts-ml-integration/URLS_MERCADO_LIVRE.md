# 🔗 URLs para Configurar no Mercado Livre

O Mercado Livre pede **2 URLs diferentes** ao configurar sua aplicação:

## 1. URL de Redirecionamento OAuth

**Onde usar:** Campo "Redirect URI" ou "URL de redirecionamento" ao criar a aplicação

**URL:**
```
http://localhost:8089/wp-admin/admin.php?page=ts-ml-settings&action=oauth_callback
```

**Para produção (substitua pelo seu domínio):**
```
https://toysport.com.br/wp-admin/admin.php?page=ts-ml-settings&action=oauth_callback
```

**O que faz:** Esta URL é usada quando você autoriza a aplicação do Mercado Livre. Após autorizar, o Mercado Livre redireciona você de volta para esta URL com um código de autorização.

**Nota:** O `account_id` será adicionado automaticamente quando você clicar em "Conectar Conta" no plugin.

---

## 2. URL de Retorno de Notificações (Webhook)

**Onde usar:** Campo "URL de retornos de chamada de notificação" nas configurações da aplicação

**⚠️ IMPORTANTE:** O Mercado Livre requer que a URL use **apenas letras minúsculas**. A URL gerada pelo plugin já está formatada corretamente.

**URL (REST API - Recomendada):**
```
http://localhost:8089/wp-json/ts-ml/v1/webhook
```

**URL Alternativa (Legacy):**
```
http://localhost:8089/ts-ml-webhook/
```

**Para produção (substitua pelo seu domínio):**
```
https://toysport.com.br/wp-json/ts-ml/v1/webhook
```

**Nota do Mercado Livre:** "URL para a qual enviaremos novas notificações. Utilize somente letras minúsculas."

**O que faz:** Esta URL recebe notificações automáticas do Mercado Livre sobre:
- ✅ Novos pedidos
- ✅ Atualizações de status de pedidos
- ✅ Novas mensagens/perguntas
- ✅ Atualizações de produtos
- ✅ Mudanças de pagamento

---

## 📋 Como Configurar no Mercado Livre

1. Acesse: https://developers.mercadolivre.com.br/
2. Faça login e vá em "Minhas Aplicações"
3. Clique em "Editar" na sua aplicação
4. Configure as URLs:

   **Na seção "Configuração de notificações":**
   - Cole a URL de Webhook no campo "URL de retornos de chamada de notificação"
   
   **Na seção de configuração geral:**
   - Cole a URL de OAuth no campo "Redirect URI" ou "URL de redirecionamento"

5. Salve as alterações

---

## ✅ Verificar se Está Funcionando

### OAuth:
- Ao clicar em "Conectar Conta" no plugin, você será redirecionado para o Mercado Livre
- Após autorizar, você será redirecionado de volta para o WordPress

### Webhook:
- O Mercado Livre enviará uma requisição POST para a URL de webhook
- Você pode verificar os logs do plugin (se modo debug estiver ativo)
- Os logs estarão em: `wp-content/uploads/ts-ml-logs/`

---

## 🔧 Resolução de Problemas

### Webhook não está recebendo notificações:
1. Verifique se a URL está correta no painel do Mercado Livre
2. Certifique-se de que seu servidor aceita requisições POST externas
3. Verifique se não há firewall bloqueando
4. Ative o modo debug no plugin para ver logs detalhados

### OAuth não funciona:
1. Verifique se a URL de redirecionamento está exatamente igual no Mercado Livre
2. Certifique-se de que não há espaços ou caracteres extras
3. A URL deve ser HTTPS em produção

---

## 📝 Notas Importantes

- ⚠️ **Em produção, use sempre HTTPS** para ambas as URLs
- ⚠️ **A URL de webhook deve ser acessível publicamente** (sem autenticação)
- ⚠️ **A URL de OAuth deve corresponder exatamente** à configurada no Mercado Livre
- ✅ O plugin suporta múltiplas contas do Mercado Livre
- ✅ Cada conta pode ter suas próprias credenciais
