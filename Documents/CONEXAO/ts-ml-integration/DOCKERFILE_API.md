# 🐳 Dockerfile para API Standalone

## 📋 Dockerfile Completo

**Arquivo:** `Dockerfile` (na raiz do projeto API)

```dockerfile
FROM php:8.2-apache

# Instalar extensões necessárias
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Habilitar mod_rewrite
RUN a2enmod rewrite

# Copiar arquivos
COPY api/ /var/www/html/api/
COPY downloads/ /var/www/html/downloads/

# Configurar permissões
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

# Configurar Apache
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html\n\
    <Directory /var/www/html>\n\
        Options Indexes FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

EXPOSE 80

CMD ["apache2-foreground"]
```

---

## 🚀 Deploy no Coolify com Dockerfile

### 1. **Estrutura do Projeto:**

```
ts-ml-api-server/
├── Dockerfile
├── api/
│   └── update-api.php
├── downloads/
│   └── (ZIPs aqui)
└── .dockerignore
```

### 2. **No Coolify:**

1. **Criar Projeto:**
   - New Resource > Docker
   - Git Repository: `https://github.com/seu-usuario/ts-ml-api-server.git`
   - Dockerfile: `Dockerfile`
   - Domain: `api.seusite.com.br`

2. **Deploy:**
   - Coolify detecta Dockerfile
   - Faz build automaticamente
   - Deploy automático

---

## 📝 .dockerignore

```
.git
.gitignore
README.md
*.md
.env
node_modules
```

---

**Última atualização:** Janeiro 2026
