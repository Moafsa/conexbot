# 🚀 Como Fazer Deploy no Servidor - Plugin e API

## 🎯 Opções de Hospedagem

Você tem várias opções para hospedar o plugin e a API:

1. **Coolify** (Recomendado - fácil e moderno)
2. **Servidor WordPress tradicional**
3. **VPS/Cloud** (DigitalOcean, AWS, etc)
4. **GitHub Pages + Serverless** (para API)

---

## 🐳 Opção 1: Coolify (Recomendado)

### O Que é Coolify?

Coolify é uma plataforma open-source de deploy que facilita hospedar aplicações WordPress, APIs, etc.

### Vantagens:
- ✅ Deploy automático via Git
- ✅ SSL automático
- ✅ Gerenciamento fácil
- ✅ Suporta WordPress
- ✅ Suporta PHP/APIs

---

## 📋 Deploy no Coolify - Passo a Passo

### 1️⃣ **Preparar Repositório Git**

```bash
# No seu projeto local
cd ToySport/wordpress/wp-content/plugins/ts-ml-integration

# Inicializar Git (se ainda não tiver)
git init
git add .
git commit -m "Versão 1.0.0"

# Criar repositório no GitHub/GitLab
# E fazer push
git remote add origin https://github.com/seu-usuario/ts-ml-integration.git
git push -u origin main
```

---

### 2️⃣ **Criar API Separada (Para Coolify)**

Crie um projeto WordPress mínimo apenas para a API:

**Estrutura:**
```
ts-ml-api-server/
├── wp-content/
│   └── plugins/
│       └── ts-ml-update-api/
│           └── ts-ml-update-api.php
├── wp-config.php
└── .gitignore
```

**Ou use arquivo standalone:**
```
ts-ml-api-server/
├── api/
│   └── update-api.php  (standalone)
└── downloads/
    └── (ZIPs aqui)
```

---

### 3️⃣ **Deploy no Coolify**

#### **A) Deploy da API (WordPress ou Standalone)**

**Opção A1: WordPress no Coolify**

1. **No Coolify:**
   - Clique em "New Resource"
   - Escolha "WordPress"
   - Configure:
     - **Domain:** `api.seusite.com.br`
     - **Git Repository:** `https://github.com/seu-usuario/ts-ml-api-server.git`
     - **Branch:** `main`

2. **Após deploy:**
   - Acesse WordPress Admin
   - Instale plugin `ts-ml-update-api`
   - Ative plugin
   - API estará em: `https://api.seusite.com.br/wp-json/ts-ml/v1/updates`

**Opção A2: PHP Standalone no Coolify**

1. **Criar Dockerfile:**
   ```dockerfile
   FROM php:8.2-apache
   
   COPY . /var/www/html/
   
   RUN chown -R www-data:www-data /var/www/html
   RUN chmod -R 755 /var/www/html
   
   EXPOSE 80
   ```

2. **No Coolify:**
   - Clique em "New Resource"
   - Escolha "Docker"
   - Configure:
     - **Domain:** `api.seusite.com.br`
     - **Git Repository:** `https://github.com/seu-usuario/ts-ml-api-server.git`
     - **Dockerfile:** `Dockerfile`

---

### 4️⃣ **Configurar Downloads (ZIPs)**

#### **Opção A: Pasta no Servidor**

```bash
# No servidor Coolify (via SSH ou terminal)
mkdir -p /var/www/html/downloads
chmod 755 /var/www/html/downloads

# Upload dos ZIPs
scp ts-ml-integration-1.1.0.zip usuario@servidor:/var/www/html/downloads/
```

#### **Opção B: S3/MinIO (Recomendado)**

Use MinIO (incluído no Coolify) ou AWS S3:

1. **Configurar MinIO no Coolify:**
   - Crie bucket: `ts-ml-downloads`
   - Configure acesso público

2. **Upload via código:**
   ```php
   // Upload ZIP para MinIO/S3
   $s3_url = 'https://s3.seusite.com.br/ts-ml-downloads/ts-ml-integration-1.1.0.zip';
   ```

3. **Na API, retornar URL do S3:**
   ```php
   $download_url = 'https://s3.seusite.com.br/ts-ml-downloads/ts-ml-integration-' . $version . '.zip';
   ```

---

## 🔧 Configuração Completa no Coolify

### Estrutura de Projetos:

```
Coolify Dashboard
├── ts-ml-api (WordPress ou PHP)
│   └── Domain: api.seusite.com.br
│   └── Git: github.com/seu-usuario/ts-ml-api-server
│
└── ts-ml-downloads (MinIO/S3)
    └── Bucket: ts-ml-downloads
    └── Public Access: Enabled
```

---

## 📦 Opção 2: Servidor WordPress Tradicional

### Deploy Manual:

#### 1. **Upload da API:**

```bash
# Via FTP/SFTP
scp -r ts-ml-update-api usuario@servidor.com:/var/www/html/wp-content/plugins/

# Via SSH
ssh usuario@servidor.com
cd /var/www/html/wp-content/plugins
git clone https://github.com/seu-usuario/ts-ml-update-api.git
```

#### 2. **Ativar Plugin:**

- WordPress Admin > Plugins > Ativar "TS ML Update API"

#### 3. **Upload ZIPs:**

```bash
# Criar pasta
mkdir -p /var/www/html/downloads

# Upload ZIPs
scp ts-ml-integration-1.1.0.zip usuario@servidor.com:/var/www/html/downloads/
```

---

## 🐙 Opção 3: GitHub Actions + Deploy Automático

### Automatizar Deploy:

**Arquivo:** `.github/workflows/deploy-api.yml`

```yaml
name: Deploy API to Coolify

on:
  push:
    branches: [ main ]
    paths:
      - 'api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Coolify
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.COOLIFY_HOST }}
          username: ${{ secrets.COOLIFY_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/html
            git pull origin main
            # Reiniciar serviço se necessário
```

---

## 🔄 Workflow Completo com Coolify

### 1. **Desenvolvimento:**

```bash
# Desenvolver localmente
# Commit e push
git add .
git commit -m "Versão 1.1.0"
git push origin main
```

### 2. **Coolify Faz Deploy Automaticamente:**

- Coolify detecta push no Git
- Faz build automaticamente
- Deploy automático
- SSL configurado automaticamente

### 3. **Atualizar Versão na API:**

```bash
# SSH no servidor Coolify
ssh usuario@api.seusite.com.br

# Editar API
nano wp-content/plugins/ts-ml-update-api/ts-ml-update-api.php

# Mudar versão
$latest_version = '1.1.0';

# Salvar e pronto!
```

---

## 📁 Estrutura de Repositórios Recomendada

### Repositório 1: Plugin (Para Clientes)

```
ts-ml-integration/
├── ts-ml-integration.php
├── includes/
├── admin/
└── ...
```

**Uso:** Clientes baixam e instalam no WordPress deles.

### Repositório 2: API Server (Para Seu Servidor)

```
ts-ml-api-server/
├── wp-content/
│   └── plugins/
│       └── ts-ml-update-api/
│           └── ts-ml-update-api.php
├── downloads/  (ou usar S3)
└── Dockerfile (se usar standalone)
```

**Uso:** Deploy no Coolify/servidor para servir API.

---

## 🎯 Configuração no Coolify - Detalhado

### Passo 1: Criar Projeto WordPress

1. **No Coolify Dashboard:**
   - Clique em "New Resource"
   - Escolha "WordPress"
   - Preencha:
     ```
     Name: ts-ml-api
     Domain: api.seusite.com.br
     Git Repository: https://github.com/seu-usuario/ts-ml-api-server.git
     Branch: main
     ```

2. **Configurar Variáveis de Ambiente:**
   ```
   WORDPRESS_DB_NAME=ts_ml_api
   WORDPRESS_DB_USER=admin
   WORDPRESS_DB_PASSWORD=senha_segura
   ```

3. **Deploy:**
   - Coolify faz build e deploy automaticamente
   - Aguarde alguns minutos
   - Acesse: `https://api.seusite.com.br`

### Passo 2: Instalar Plugin de API

1. **Acesse WordPress Admin:**
   - `https://api.seusite.com.br/wp-admin`
   - Faça login

2. **Instalar Plugin:**
   - Plugins > Adicionar Novo > Enviar Plugin
   - Ou via Git (se plugin está no repositório)

3. **Ativar Plugin:**
   - Plugins > Ativar "TS ML Update API"

### Passo 3: Configurar Downloads

**Opção A: Pasta no Servidor**

```bash
# Via SSH no Coolify
ssh usuario@api.seusite.com.br
mkdir -p /var/www/html/downloads
chmod 755 /var/www/html/downloads
```

**Opção B: MinIO (Incluído no Coolify)**

1. **No Coolify:**
   - Clique em "New Resource"
   - Escolha "MinIO"
   - Configure bucket público

2. **Upload ZIPs:**
   ```bash
   # Via MinIO UI ou API
   mc cp ts-ml-integration-1.1.0.zip minio/ts-ml-downloads/
   ```

---

## 🔄 Deploy Automático com Git

### Configurar Webhook no Coolify:

1. **No Coolify:**
   - Vá em configurações do projeto
   - Copie "Webhook URL"

2. **No GitHub:**
   - Settings > Webhooks
   - Adicione webhook do Coolify
   - Eventos: Push

3. **Pronto!**
   - A cada push, Coolify faz deploy automaticamente

---

## 📝 Exemplo Prático Completo

### Cenário: Deploy no Coolify

#### 1. **Preparar Repositório API:**

```bash
# Criar estrutura
mkdir ts-ml-api-server
cd ts-ml-api-server

# Criar plugin de API
mkdir -p wp-content/plugins/ts-ml-update-api
# Copiar ts-ml-update-api.php para aqui

# Git
git init
git add .
git commit -m "API inicial"
git remote add origin https://github.com/seu-usuario/ts-ml-api-server.git
git push -u origin main
```

#### 2. **Deploy no Coolify:**

1. Criar projeto WordPress
2. Conectar com repositório Git
3. Coolify faz deploy automático
4. Instalar plugin de API
5. Configurar downloads

#### 3. **Configurar Plugin do Cliente:**

```php
// ts-ml-integration.php
Update URI: https://api.seusite.com.br/updates/ts-ml-integration
```

---

## 🐳 Docker Compose (Alternativa ao Coolify)

Se preferir Docker direto:

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_NAME: ts_ml_api
      WORDPRESS_DB_USER: admin
      WORDPRESS_DB_PASSWORD: senha
    volumes:
      - ./wp-content:/var/www/html/wp-content
      - ./downloads:/var/www/html/downloads
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ts_ml_api
      MYSQL_USER: admin
      MYSQL_PASSWORD: senha
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

**Deploy:**
```bash
docker-compose up -d
```

---

## 🔐 Segurança no Coolify

### Configurar HTTPS:

Coolify configura SSL automaticamente via Let's Encrypt!

### Proteger API (Opcional):

```php
// Adicionar autenticação básica
add_filter('rest_authentication_errors', function($result) {
    if (!empty($result)) {
        return $result;
    }
    
    // Verificar token
    $token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
    if ($token !== 'seu-token-secreto') {
        return new WP_Error('forbidden', 'Acesso negado', array('status' => 403));
    }
    
    return $result;
});
```

---

## 📊 Monitoramento

### Logs no Coolify:

- Acesse projeto > Logs
- Veja logs em tempo real
- Debug de problemas

### Analytics:

```php
// Log de requisições na API
function ts_ml_log_request($data) {
    $log_file = '/var/www/html/logs/api-requests.log';
    $log_entry = date('Y-m-d H:i:s') . " - " . json_encode($data) . "\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND);
}
```

---

## ✅ Checklist de Deploy

- [ ] **Repositório Git** criado
- [ ] **API preparada** (WordPress ou standalone)
- [ ] **Coolify configurado** (ou servidor tradicional)
- [ ] **Projeto WordPress** criado no Coolify
- [ ] **Plugin de API** instalado e ativado
- [ ] **Pasta downloads** criada (ou S3 configurado)
- [ ] **Update URI** configurado no plugin cliente
- [ ] **API testada** manualmente
- [ ] **SSL configurado** (automático no Coolify)
- [ ] **Deploy automático** configurado (webhook)

---

## 🚀 Próximos Passos

1. **Escolha método:** Coolify ou servidor tradicional
2. **Prepare repositórios:** Plugin e API separados
3. **Faça deploy:** Siga guia acima
4. **Teste:** Verifique se API funciona
5. **Configure:** Update URI no plugin cliente

---

## 📚 Recursos

- **Coolify Docs:** https://coolify.io/docs
- **GitHub Actions:** https://docs.github.com/en/actions
- **Docker Compose:** https://docs.docker.com/compose/

---

**Última atualização:** Janeiro 2026
