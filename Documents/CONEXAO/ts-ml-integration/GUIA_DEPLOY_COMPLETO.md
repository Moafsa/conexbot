# 🚀 Guia Completo: Deploy no Servidor (Coolify ou Tradicional)

## 🎯 Resposta Direta

> **"Como eu envio isto para um servidor? Posso usar Coolify?"**

**SIM!** Coolify é perfeito para isso! Vou te mostrar como fazer.

---

## 🐳 Opção 1: Coolify (Recomendado - Mais Fácil)

### Por Que Coolify?

- ✅ **Deploy automático** via Git
- ✅ **SSL automático** (HTTPS)
- ✅ **Gerenciamento visual** fácil
- ✅ **Gratuito** (self-hosted)
- ✅ **Suporta WordPress e PHP**

---

## 📋 Passo a Passo no Coolify

### 1️⃣ **Preparar Estrutura**

Crie 2 repositórios separados:

#### **Repositório 1: Plugin (Para Clientes)**
```
ts-ml-integration/
└── (código do plugin)
```
**Uso:** Clientes baixam e instalam.

#### **Repositório 2: API Server (Para Seu Servidor)**
```
ts-ml-api-server/
├── Dockerfile
├── api/
│   └── update-api.php
└── downloads/
    └── (ZIPs aqui)
```
**Uso:** Deploy no Coolify.

---

### 2️⃣ **Criar API Server**

**Estrutura:**
```
ts-ml-api-server/
├── Dockerfile          ← Criar este arquivo
├── api/
│   └── update-api.php ← Copiar de api/update-api-standalone.php
├── downloads/          ← Pasta vazia (ZIPs via upload)
└── README.md
```

**Dockerfile:**
```dockerfile
FROM php:8.2-apache

RUN a2enmod rewrite

COPY api/ /var/www/html/api/
COPY downloads/ /var/www/html/downloads/

RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

EXPOSE 80
CMD ["apache2-foreground"]
```

**Arquivo já criado em:** `ts-ml-api-server/Dockerfile`

---

### 3️⃣ **Configurar API**

**Editar:** `api/update-api.php`

```php
// CONFIGURE AQUI:
define('TS_ML_LATEST_VERSION', '1.1.0');
define('TS_ML_SITE_URL', 'https://api.seusite.com.br');
define('TS_ML_DOWNLOAD_URL', TS_ML_SITE_URL . '/downloads/ts-ml-integration-' . TS_ML_LATEST_VERSION . '.zip');
```

---

### 4️⃣ **Deploy no Coolify**

#### **A) Criar Projeto:**

1. **Acesse Coolify Dashboard**
2. **Clique:** "New Resource"
3. **Escolha:** "Docker"
4. **Configure:**
   ```
   Name: ts-ml-api
   Domain: api.seusite.com.br
   Git Repository: https://github.com/seu-usuario/ts-ml-api-server.git
   Branch: main
   Dockerfile: Dockerfile
   ```

5. **Deploy:**
   - Clique em "Deploy"
   - Aguarde build (2-5 minutos)
   - Coolify configura SSL automaticamente!

#### **B) Upload ZIPs:**

**Opção 1: Via SSH**
```bash
# Conectar ao servidor Coolify
ssh usuario@api.seusite.com.br

# Criar pasta (se não existir)
mkdir -p /var/www/html/downloads

# Upload ZIP (do seu computador)
scp ts-ml-integration-1.1.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/
```

**Opção 2: Via Coolify File Manager**
- Acesse projeto > Files
- Navegue até `/downloads`
- Upload ZIPs

**Opção 3: Via Git (não recomendado para ZIPs grandes)**
```bash
# Adicionar ZIP ao repositório (cuidado com tamanho!)
git add downloads/ts-ml-integration-1.1.0.zip
git commit -m "Adicionar versão 1.1.0"
git push
```

---

### 5️⃣ **Configurar Plugin Cliente**

**Arquivo:** `ts-ml-integration.php` (linha 15)

```php
/**
 * Update URI: https://api.seusite.com.br/updates/ts-ml-integration
 */
```

O plugin converte automaticamente para:
```
https://api.seusite.com.br/wp-json/ts-ml/v1/updates
```

**MAS** se você usar arquivo standalone, a URL será:
```
https://api.seusite.com.br/api/update-api.php
```

**Configure no plugin:**
```php
// Via constante no wp-config.php do cliente
define('TS_ML_UPDATE_API_URL', 'https://api.seusite.com.br/api/update-api.php');
```

---

## 🔄 Deploy Automático com Git

### Configurar Webhook:

1. **No Coolify:**
   - Vá em configurações do projeto
   - Copie "Webhook URL"

2. **No GitHub:**
   - Settings > Webhooks > Add webhook
   - URL: Cole webhook do Coolify
   - Content type: `application/json`
   - Events: `Just the push event`

3. **Pronto!**
   - A cada `git push`, Coolify faz deploy automaticamente!

---

## 📦 Opção 2: Servidor WordPress Tradicional

### Se Não Quiser Usar Coolify:

#### 1. **Upload da API:**

```bash
# Via FTP/SFTP
# Upload pasta ts-ml-update-api para:
/var/www/html/wp-content/plugins/ts-ml-update-api/
```

#### 2. **Ativar Plugin:**

- WordPress Admin > Plugins > Ativar "TS ML Update API"

#### 3. **Upload ZIPs:**

```bash
# Criar pasta
mkdir -p /var/www/html/downloads

# Upload ZIPs
scp ts-ml-integration-1.1.0.zip usuario@servidor:/var/www/html/downloads/
```

---

## 🎯 Estrutura Completa no Coolify

```
Coolify Dashboard
├── ts-ml-api (Docker)
│   ├── Domain: api.seusite.com.br
│   ├── Git: github.com/seu-usuario/ts-ml-api-server
│   ├── Dockerfile: Dockerfile
│   └── Volumes:
│       └── /var/www/html/downloads (ZIPs)
│
└── (Opcional) ts-ml-minio (MinIO para downloads)
    └── Bucket: ts-ml-downloads
```

---

## 🔧 Configuração da API para Coolify

### Se Usar Arquivo Standalone:

**URL da API será:**
```
https://api.seusite.com.br/api/update-api.php
```

**Configure no plugin cliente:**
```php
// Opção 1: Via constante
define('TS_ML_UPDATE_API_URL', 'https://api.seusite.com.br/api/update-api.php');

// Opção 2: Via Update URI (precisa ajustar conversão)
// O plugin converte Update URI para REST API, mas você pode forçar:
Update URI: https://api.seusite.com.br/api/update-api.php
```

**Ou ajuste a classe para suportar URLs diretas:**
```php
// Em class-ts-ml-auto-updater.php
// Se Update URI já é uma URL completa de API, usar diretamente
if (strpos($update_uri, '/wp-json/') !== false || strpos($update_uri, '/api/') !== false) {
    return $update_uri; // Já é URL de API
}
```

---

## 📝 Exemplo Prático Completo

### Cenário: Deploy no Coolify

#### 1. **Preparar Repositório:**

```bash
# Criar estrutura
mkdir ts-ml-api-server
cd ts-ml-api-server

# Copiar arquivos
cp ../wordpress/wp-content/plugins/ts-ml-integration/api/update-api-standalone.php api/update-api.php

# Criar Dockerfile (já criado em ts-ml-api-server/)
# Criar pasta downloads
mkdir downloads

# Git
git init
git add .
git commit -m "API inicial"
git remote add origin https://github.com/seu-usuario/ts-ml-api-server.git
git push -u origin main
```

#### 2. **Deploy no Coolify:**

1. New Resource > Docker
2. Git: `https://github.com/seu-usuario/ts-ml-api-server.git`
3. Domain: `api.seusite.com.br`
4. Deploy!

#### 3. **Configurar API:**

```bash
# SSH no servidor
ssh usuario@api.seusite.com.br

# Editar API
nano /var/www/html/api/update-api.php

# Configurar:
TS_ML_LATEST_VERSION = '1.1.0'
TS_ML_SITE_URL = 'https://api.seusite.com.br'
```

#### 4. **Upload ZIP:**

```bash
# Do seu computador
scp ts-ml-integration-1.1.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/
```

#### 5. **Configurar Plugin Cliente:**

```php
// ts-ml-integration.php
Update URI: https://api.seusite.com.br/updates/ts-ml-integration

// E definir constante (se usar standalone)
define('TS_ML_UPDATE_API_URL', 'https://api.seusite.com.br/api/update-api.php');
```

---

## ✅ Checklist de Deploy

- [ ] **Repositório API** criado no GitHub
- [ ] **Dockerfile** criado
- **Coolify:**
  - [ ] **Projeto Docker** criado
  - [ ] **Git conectado**
  - [ ] **Deploy realizado**
  - [ ] **SSL configurado** (automático)
- **API:**
  - [ ] **Versão configurada**
  - [ ] **URLs configuradas**
  - [ ] **ZIPs uploadados**
- **Plugin Cliente:**
  - [ ] **Update URI configurado**
  - [ ] **Constante configurada** (se necessário)
- **Testes:**
  - [ ] **API testada** com curl
  - [ ] **Plugin testado** no WordPress
  - [ ] **Notificação funciona**

---

## 🚨 Problemas Comuns

### Coolify não faz deploy:

1. Verifique webhook no GitHub
2. Verifique logs no Coolify
3. Verifique Dockerfile
4. Teste build local: `docker build -t test .`

### API não responde:

1. Verifique URL: `https://api.seusite.com.br/api/update-api.php`
2. Verifique permissões de arquivos
3. Verifique logs do Apache no Coolify
4. Teste acesso direto no navegador

### Download falha:

1. Verifique se ZIP existe: `/var/www/html/downloads/`
2. Verifique permissões: `chmod 644 downloads/*.zip`
3. Teste URL diretamente no navegador
4. Verifique CORS (se necessário)

---

## 📚 Arquivos Criados

1. **`ts-ml-api-server/Dockerfile`** - Dockerfile pronto
2. **`ts-ml-api-server/README.md`** - Instruções
3. **`COMO_DEPLOYAR_SERVIDOR.md`** - Guia completo
4. **`DEPLOY_COOLIFY.md`** - Guia rápido Coolify
5. **`GUIA_DEPLOY_COMPLETO.md`** - Este arquivo

---

## 🚀 Próximos Passos

1. **Escolha método:** Coolify (recomendado) ou servidor tradicional
2. **Prepare repositório:** Crie `ts-ml-api-server` no GitHub
3. **Deploy:** Siga guia acima
4. **Teste:** Verifique se API funciona
5. **Configure:** Update URI no plugin cliente

---

**Última atualização:** Janeiro 2026
