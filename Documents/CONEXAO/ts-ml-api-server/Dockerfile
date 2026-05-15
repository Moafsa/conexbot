FROM php:8.2-apache

# Habilitar mod_rewrite do Apache
RUN a2enmod rewrite

# Copiar arquivos da API
COPY api/ /var/www/html/api/
COPY downloads/ /var/www/html/downloads/

# Criar arquivo .htaccess para API
RUN echo 'RewriteEngine On\n\
RewriteCond %{REQUEST_FILENAME} !-f\n\
RewriteCond %{REQUEST_FILENAME} !-d\n\
RewriteRule ^api/(.*)$ api/update-api.php [L,QSA]' > /var/www/html/.htaccess

# Configurar permissões
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html
RUN chmod 644 /var/www/html/.htaccess

# Expor porta 80
EXPOSE 80

# Comando padrão
CMD ["apache2-foreground"]
