# TS-ML Integration - API Server

Este é o servidor de API para atualizações automáticas do plugin TS-ML Integration.

## 🚀 Deploy no Coolify

### Passo 1: Configurar

1. Edite `api/update-api.php`:
   - Configure `TS_ML_LATEST_VERSION`
   - Configure `TS_ML_SITE_URL`
   - Configure `TS_ML_DOWNLOAD_URL`

### Passo 2: Deploy

1. No Coolify:
   - New Resource > Docker
   - Git Repository: este repositório
   - Dockerfile: `Dockerfile`
   - Domain: `api.seusite.com.br`

2. Coolify faz deploy automático!

### Passo 3: Upload ZIPs

```bash
# Via SSH
scp ts-ml-integration-1.1.0.zip usuario@api.seusite.com.br:/var/www/html/downloads/
```

## 📁 Estrutura

```
ts-ml-api-server/
├── Dockerfile
├── api/
│   └── update-api.php
├── downloads/
│   └── (ZIPs aqui)
└── README.md
```

## 🔧 Configuração

Edite `api/update-api.php` e configure:
- Versão mais recente
- URL de download
- Changelog

## 🔗 URLs

- **API:** `https://api.seusite.com.br/api/update-api.php`
- **Downloads:** `https://api.seusite.com.br/downloads/ts-ml-integration-X.X.X.zip`
