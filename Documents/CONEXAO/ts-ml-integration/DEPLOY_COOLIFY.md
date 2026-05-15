# 🚀 Deploy no Coolify - Guia Rápido

## ⚡ Resumo em 5 Passos

### 1️⃣ **Preparar Repositório API**

```bash
# Criar estrutura
mkdir ts-ml-api-server
cd ts-ml-api-server

# Copiar arquivo standalone
cp ../api/update-api-standalone.php api/update-api.php

# Criar Dockerfile
cat > Dockerfile << 'EOF'
FROM php:8.2-apache
RUN a2enmod rewrite
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
CMD ["apache2-foreground"]
EOF

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
2. **Clique:** "New Resource" > "Docker"
3. **Configure:**
   - **Name:** `ts-ml-api`
   - **Domain:** `api.seusite.com.br`
   - **Git Repository:** `https://github.com/seu-usuario/ts-ml-api-server.git`
   - **Branch:** `main`
   - **Dockerfile:** `Dockerfile`

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde build (2-5 minutos)
   - Coolify configura SSL automaticamente

---

### 3️⃣ **Configurar API**

**Editar arquivo:** `api/update-api.php`

```php
// CONFIGURE AQUI:
define('TS_ML_LATEST_VERSION', '1.1.0');
define('TS_ML_SITE_URL', 'https://api.seusite.com.br');
define('TS_ML_DOWNLOAD_URL', TS_ML_SITE_URL . '/downloads/ts-ml-integration-' . TS_ML_LATEST_VERSION . '.zip');
```

**Commit e push:**
```bash
git add .
git commit -m "Configurar versão 1.1.0"
git push
```

Coolify faz deploy automático!

---

### 4️⃣ **Upload ZIPs**

**Via SSH no Coolify:**
```bash
# Conectar ao container
ssh usuario@api.seusite.com.br

# Criar pasta downloads
mkdir -p /var/www/html/downloads

# Upload ZIP (do seu computador)
scp ts-ml-integration-1.1.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/
```

**Ou via Coolify File Manager:**
- Acesse projeto > Files
- Navegue até `/downloads`
- Upload ZIPs

---

### 5️⃣ **Configurar Plugin Cliente**

**Arquivo:** `ts-ml-integration.php`

```php
/**
 * Update URI: https://api.seusite.com.br/updates/ts-ml-integration
 */
```

**Pronto!** Sistema funcionando!

---

## 🔄 Atualizar Versão (Futuro)

### Quando lançar versão 1.2.0:

1. **Editar API:**
   ```php
   define('TS_ML_LATEST_VERSION', '1.2.0');
   ```

2. **Commit e push:**
   ```bash
   git commit -am "Versão 1.2.0"
   git push
   ```

3. **Upload ZIP:**
   ```bash
   scp ts-ml-integration-1.2.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/
   ```

4. **Coolify faz deploy automático!**
5. **Clientes recebem notificação automaticamente!**

---

## ✅ Vantagens do Coolify

- ✅ **Deploy automático** via Git
- ✅ **SSL automático** (Let's Encrypt)
- ✅ **Gerenciamento fácil** via dashboard
- ✅ **Logs em tempo real**
- ✅ **Rollback fácil** se algo der errado
- ✅ **Gratuito** (self-hosted)

---

## 📚 Estrutura Final

```
Coolify Dashboard
└── ts-ml-api
    ├── Domain: api.seusite.com.br
    ├── Git: github.com/seu-usuario/ts-ml-api-server
    ├── Dockerfile: Dockerfile
    └── Volumes:
        └── /var/www/html/downloads (ZIPs)
```

---

## 🧪 Testar

```bash
# Testar API
curl -X POST https://api.seusite.com.br/api/update-api.php \
  -d "action=version_check&version=1.0.0&plugin=ts-ml-integration"
```

---

**Última atualização:** Janeiro 2026
