# 🎯 Passo a Passo: Deploy no Coolify

## 📋 Checklist Completo

### ✅ Passo 1: Preparar Estrutura Local

```bash
# 1. Estrutura já está criada em:
ts-ml-api-server/
├── Dockerfile          ✅ Criado
├── api/
│   └── update-api.php ✅ Criado (copie conteúdo)
├── downloads/          ✅ Criar pasta vazia
└── README.md          ✅ Criado
```

**Ações:**
1. ✅ Dockerfile já criado
2. ✅ Copiar `api/update-api.php` do plugin para `ts-ml-api-server/api/`
3. ✅ Criar pasta `downloads/` vazia

---

### ✅ Passo 2: Configurar API

**Editar:** `ts-ml-api-server/api/update-api.php`

```php
// MUDAR ESTAS 3 LINHAS:
define('TS_ML_LATEST_VERSION', '1.0.0');  // ← Versão atual
define('TS_ML_SITE_URL', 'https://api.seusite.com.br');  // ← Seu domínio
define('TS_ML_DOWNLOAD_URL', TS_ML_SITE_URL . '/downloads/ts-ml-integration-' . TS_ML_LATEST_VERSION . '.zip');
```

---

### ✅ Passo 3: Criar Repositório Git

```bash
cd ts-ml-api-server

# Inicializar Git
git init
git add .
git commit -m "API inicial - Versão 1.0.0"

# Criar repositório no GitHub/GitLab
# (crie manualmente no GitHub)

# Conectar
git remote add origin https://github.com/seu-usuario/ts-ml-api-server.git
git push -u origin main
```

---

### ✅ Passo 4: Deploy no Coolify

#### **A) Criar Projeto:**

1. **Acesse:** Coolify Dashboard
2. **Clique:** "New Resource"
3. **Escolha:** "Docker"
4. **Preencha:**
   ```
   Name: ts-ml-api
   Domain: api.seusite.com.br
   Git Repository: https://github.com/seu-usuario/ts-ml-api-server.git
   Branch: main
   Dockerfile: Dockerfile
   ```
5. **Clique:** "Deploy"
6. **Aguarde:** 2-5 minutos (build automático)
7. **SSL:** Configurado automaticamente! ✅

#### **B) Verificar Deploy:**

- Acesse: `https://api.seusite.com.br`
- Deve mostrar página padrão do Apache ou erro 404 (normal)

---

### ✅ Passo 5: Testar API

```bash
# Testar endpoint
curl -X POST https://api.seusite.com.br/api/update-api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "version_check",
    "plugin": "ts-ml-integration",
    "version": "0.9.0"
  }'
```

**Resposta esperada:**
```json
{
    "version": "1.0.0",
    "update_available": true,
    "download_url": "https://api.seusite.com.br/downloads/ts-ml-integration-1.0.0.zip",
    ...
}
```

---

### ✅ Passo 6: Upload ZIPs

#### **Opção A: Via SSH**

```bash
# Conectar ao servidor Coolify
ssh usuario@api.seusite.com.br

# Criar pasta (se não existir)
mkdir -p /var/www/html/downloads

# Upload ZIP (do seu computador)
scp ts-ml-integration-1.0.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/

# Verificar
ls -lh /var/www/html/downloads/
```

#### **Opção B: Via Coolify File Manager**

1. No Coolify Dashboard
2. Vá em projeto `ts-ml-api`
3. Clique em "Files" ou "Terminal"
4. Navegue até `/var/www/html/downloads`
5. Upload ZIPs

#### **Opção C: Via Git (não recomendado para ZIPs grandes)**

```bash
# Adicionar ZIP ao repositório
git add downloads/ts-ml-integration-1.0.0.zip
git commit -m "Adicionar versão 1.0.0"
git push

# Coolify faz deploy automático
```

---

### ✅ Passo 7: Configurar Plugin Cliente

**Arquivo:** `ts-ml-integration.php` (linha 15)

```php
/**
 * Update URI: https://api.seusite.com.br/api/update-api.php
 */
```

**OU se usar WordPress REST API:**

```php
/**
 * Update URI: https://api.seusite.com.br/updates/ts-ml-integration
 */
```

**E definir constante (se necessário):**

```php
// No wp-config.php do cliente OU no plugin
define('TS_ML_UPDATE_API_URL', 'https://api.seusite.com.br/api/update-api.php');
```

---

### ✅ Passo 8: Testar no WordPress

1. **Instale plugin** no WordPress do cliente
2. **Acesse:** Plugins > Plugins Instalados
3. **Clique:** "Verificar atualizações"
4. **Deve aparecer:** "Nova versão disponível" ✅

---

## 🔄 Atualizar Versão (Futuro)

### Quando lançar versão 1.1.0:

#### 1. **Editar API:**

```bash
# SSH no servidor ou editar localmente
nano ts-ml-api-server/api/update-api.php

# Mudar:
define('TS_ML_LATEST_VERSION', '1.1.0');
```

#### 2. **Commit e Push:**

```bash
cd ts-ml-api-server
git add api/update-api.php
git commit -m "Atualizar para versão 1.1.0"
git push
```

#### 3. **Coolify Faz Deploy Automático!**

- Coolify detecta push
- Faz rebuild
- Deploy automático
- SSL mantido

#### 4. **Upload Novo ZIP:**

```bash
scp ts-ml-integration-1.1.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/
```

#### 5. **Pronto!**

- Clientes recebem notificação automaticamente
- Podem atualizar com 1 clique

---

## 📊 Estrutura Final no Coolify

```
Coolify Dashboard
└── ts-ml-api (Docker)
    ├── Domain: api.seusite.com.br
    ├── Git: github.com/seu-usuario/ts-ml-api-server
    ├── Dockerfile: Dockerfile
    ├── Status: ✅ Running
    ├── SSL: ✅ Let's Encrypt (automático)
    └── Volumes:
        └── /var/www/html/downloads (ZIPs)
```

---

## 🧪 Testes

### Teste 1: API Responde

```bash
curl -X POST https://api.seusite.com.br/api/update-api.php \
  -d "action=version_check&version=0.9.0&plugin=ts-ml-integration"
```

### Teste 2: Download Funciona

```bash
# Testar download direto
curl -I https://api.seusite.com.br/downloads/ts-ml-integration-1.0.0.zip
```

### Teste 3: WordPress Detecta

```bash
# No WordPress do cliente
wp plugin list --update=available
```

---

## ✅ Checklist Final

- [ ] **Estrutura criada** (`ts-ml-api-server/`)
- [ ] **API configurada** (versão e URLs)
- [ ] **Repositório Git** criado e conectado
- [ ] **Projeto criado** no Coolify
- [ ] **Deploy realizado** com sucesso
- [ ] **SSL configurado** (automático)
- [ ] **ZIPs uploadados** para `/downloads`
- [ ] **API testada** manualmente
- [ ] **Update URI configurado** no plugin cliente
- [ ] **Plugin testado** no WordPress
- [ ] **Notificação funciona** ✅

---

## 🚨 Problemas Comuns

### API retorna 404:

- Verifique se arquivo está em `/var/www/html/api/update-api.php`
- Verifique permissões: `chmod 644 api/update-api.php`
- Verifique .htaccess (se necessário)

### Download não funciona:

- Verifique se ZIP existe: `ls -lh /var/www/html/downloads/`
- Verifique permissões: `chmod 644 downloads/*.zip`
- Teste URL diretamente no navegador

### WordPress não detecta:

- Limpe cache: `delete_transient('update_plugins')`
- Verifique Update URI no cabeçalho
- Verifique se API retorna JSON válido
- Force verificação: `wp_update_plugins()`

---

## 📚 Documentação

- **Guia Completo:** `GUIA_DEPLOY_COMPLETO.md`
- **Deploy Coolify:** `DEPLOY_COOLIFY.md`
- **Resumo:** `RESUMO_DEPLOY.md`

---

**Última atualização:** Janeiro 2026
