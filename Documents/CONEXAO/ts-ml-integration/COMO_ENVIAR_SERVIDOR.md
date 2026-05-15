# 🚀 Como Enviar para o Servidor - Resumo Simples

## 🎯 Resposta Direta

> **"Como eu envio isto para um servidor? Posso usar Coolify?"**

**SIM!** Coolify é perfeito! Aqui está como fazer de forma simples:

---

## 📋 O Que Você Precisa Fazer

### 1️⃣ **Preparar Estrutura** (5 minutos)

Você precisa criar **2 coisas separadas**:

#### **A) Plugin** (para clientes baixarem)
```
ts-ml-integration/  ← Já existe!
└── (código do plugin)
```
**Uso:** Clientes instalam no WordPress deles.

#### **B) API Server** (para seu servidor)
```
ts-ml-api-server/  ← Criar este!
├── Dockerfile
├── api/
│   └── update-api.php
└── downloads/
    └── (ZIPs aqui)
```
**Uso:** Deploy no Coolify para servir API.

---

### 2️⃣ **Criar API Server** (10 minutos)

#### **Passo 1: Criar Estrutura**

```bash
# Criar pasta
mkdir ts-ml-api-server
cd ts-ml-api-server

# Criar estrutura
mkdir -p api downloads
```

#### **Passo 2: Copiar Arquivos**

1. **Copiar Dockerfile:**
   - Já criado em: `ts-ml-api-server/Dockerfile`
   - ✅ Pronto para usar

2. **Copiar API:**
   ```bash
   # Copiar arquivo standalone
   cp ../wordpress/wp-content/plugins/ts-ml-integration/api/update-api-standalone.php api/update-api.php
   ```

3. **Editar API:**
   ```php
   // api/update-api.php - MUDAR ESTAS 3 LINHAS:
   define('TS_ML_LATEST_VERSION', '1.0.0');  // ← Versão atual
   define('TS_ML_SITE_URL', 'https://api.seusite.com.br');  // ← Seu domínio
   define('TS_ML_DOWNLOAD_URL', TS_ML_SITE_URL . '/downloads/ts-ml-integration-' . TS_ML_LATEST_VERSION . '.zip');
   ```

#### **Passo 3: Git**

```bash
git init
git add .
git commit -m "API inicial"
git remote add origin https://github.com/seu-usuario/ts-ml-api-server.git
git push -u origin main
```

---

### 3️⃣ **Deploy no Coolify** (5 minutos)

1. **Acesse:** Coolify Dashboard
2. **Clique:** "New Resource" > "Docker"
3. **Configure:**
   ```
   Name: ts-ml-api
   Domain: api.seusite.com.br
   Git: https://github.com/seu-usuario/ts-ml-api-server.git
   Dockerfile: Dockerfile
   ```
4. **Deploy!**
5. **Aguarde:** 2-5 minutos
6. **Pronto!** SSL configurado automaticamente ✅

---

### 4️⃣ **Upload ZIPs** (2 minutos)

```bash
# Via script fornecido
cd scripts
./upload-zip-api.sh 1.0.0 usuario api.seusite.com.br

# OU manualmente
scp ts-ml-integration-1.0.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/
```

---

### 5️⃣ **Configurar Plugin Cliente** (1 minuto)

**Arquivo:** `ts-ml-integration.php` (linha 15)

```php
/**
 * Update URI: https://api.seusite.com.br/api/update-api.php
 */
```

**Pronto!** Sistema funcionando! ✅

---

## 🔄 Quando Atualizar Versão

### Exemplo: Lançar versão 1.1.0

#### 1. **Editar API:**

```bash
# Editar localmente
nano ts-ml-api-server/api/update-api.php

# Mudar:
define('TS_ML_LATEST_VERSION', '1.1.0');
```

#### 2. **Commit e Push:**

```bash
cd ts-ml-api-server
git add api/update-api.php
git commit -m "Versão 1.1.0"
git push
```

#### 3. **Coolify Faz Deploy Automático!**

- Detecta push
- Faz rebuild
- Deploy automático
- ✅ Pronto!

#### 4. **Upload ZIP:**

```bash
./scripts/upload-zip-api.sh 1.1.0 usuario api.seusite.com.br
```

#### 5. **Clientes Recebem Notificação Automaticamente!**

---

## 📁 Estrutura Completa

```
Seu Computador
├── ToySport/
│   ├── wordpress/wp-content/plugins/ts-ml-integration/  ← Plugin (clientes)
│   └── ts-ml-api-server/                               ← API (servidor)
│       ├── Dockerfile
│       ├── api/update-api.php
│       └── downloads/ (vazia, ZIPs via upload)
│
GitHub
├── ts-ml-integration/        ← Repositório do plugin
└── ts-ml-api-server/         ← Repositório da API
│
Coolify
└── ts-ml-api (Docker)
    ├── Domain: api.seusite.com.br
    ├── Git: github.com/seu-usuario/ts-ml-api-server
    └── Volumes: /var/www/html/downloads (ZIPs)
```

---

## ✅ Resumo em 3 Passos

1. **Criar API Server** → Estrutura já criada em `ts-ml-api-server/`
2. **Deploy no Coolify** → Conectar Git e fazer deploy
3. **Configurar Plugin** → Mudar Update URI

**Pronto!** Sistema funcionando! 🎉

---

## 📚 Documentação Detalhada

- **Passo a Passo:** `PASSO_A_PASSO_COOLIFY.md`
- **Guia Completo:** `GUIA_DEPLOY_COMPLETO.md`
- **Resumo:** `RESUMO_DEPLOY.md`
- **Deploy Coolify:** `DEPLOY_COOLIFY.md`

---

**Última atualização:** Janeiro 2026
