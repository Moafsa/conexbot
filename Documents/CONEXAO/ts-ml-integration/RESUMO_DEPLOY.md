# ⚡ Resumo Rápido: Deploy no Servidor

## 🎯 Resposta Direta

> **"Como eu envio isto para um servidor? Posso usar Coolify?"**

**SIM!** Coolify é perfeito! Aqui está como fazer:

---

## 🚀 Deploy no Coolify (5 Passos)

### 1️⃣ **Preparar Repositório API**

```bash
# Criar estrutura (já criada em ts-ml-api-server/)
cd ts-ml-api-server

# Copiar arquivo standalone
cp ../wordpress/wp-content/plugins/ts-ml-integration/api/update-api-standalone.php api/update-api.php

# Editar e configurar versão/URLs
nano api/update-api.php

# Git
git init
git add .
git commit -m "API inicial"
git remote add origin https://github.com/seu-usuario/ts-ml-api-server.git
git push -u origin main
```

---

### 2️⃣ **Deploy no Coolify**

1. **Acesse Coolify Dashboard**
2. **New Resource** > **Docker**
3. **Configure:**
   ```
   Name: ts-ml-api
   Domain: api.seusite.com.br
   Git: https://github.com/seu-usuario/ts-ml-api-server.git
   Dockerfile: Dockerfile
   ```
4. **Deploy!** (Coolify faz tudo automaticamente)

---

### 3️⃣ **Upload ZIPs**

```bash
# Via SSH no Coolify
ssh usuario@api.seusite.com.br
mkdir -p /var/www/html/downloads

# Upload (do seu computador)
scp ts-ml-integration-1.1.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/
```

---

### 4️⃣ **Configurar Plugin Cliente**

**Arquivo:** `ts-ml-integration.php`

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

---

### 5️⃣ **Testar**

```bash
curl -X POST https://api.seusite.com.br/api/update-api.php \
  -d "action=version_check&version=1.0.0&plugin=ts-ml-integration"
```

---

## 📁 Estrutura Criada

```
ts-ml-api-server/          ← Repositório para Coolify
├── Dockerfile             ← Pronto para usar
├── api/
│   └── update-api.php     ← Copiar standalone aqui
└── downloads/             ← ZIPs aqui (via upload)

wordpress/wp-content/plugins/ts-ml-integration/  ← Plugin cliente
└── ts-ml-integration.php  ← Configurar Update URI aqui
```

---

## 🔄 Quando Atualizar

1. **Editar API:** `api/update-api.php` → Mudar versão
2. **Commit e push:** `git push` → Coolify faz deploy automático
3. **Upload ZIP:** `scp ...zip .../downloads/`
4. **Pronto!** Clientes recebem notificação automaticamente

---

## 📚 Documentação Completa

- **Guia Completo:** `GUIA_DEPLOY_COMPLETO.md`
- **Deploy Coolify:** `DEPLOY_COOLIFY.md`
- **Dockerfile:** `DOCKERFILE_API.md`
- **Como Deployar:** `COMO_DEPLOYAR_SERVIDOR.md`

---

**Última atualização:** Janeiro 2026
