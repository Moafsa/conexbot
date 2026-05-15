# Troubleshooting - Internal Server Error na Página de Plugins

## Possíveis Causas

Se você está recebendo um "Internal Server Error" ao acessar `wp-admin/plugins.php`, as causas mais comuns são:

1. **Erro Fatal PHP**: Um erro fatal no código do plugin está impedindo o WordPress de carregar
2. **Funções não disponíveis**: O código está tentando usar funções do WordPress antes delas estarem disponíveis
3. **Problema com constantes**: Definição de constantes falhando

## Soluções Aplicadas

As seguintes correções foram aplicadas ao código:

1. ✅ Verificação de existência de funções antes de usar
2. ✅ Try-catch em operações críticas
3. ✅ Fallbacks para constantes quando funções WordPress não estão disponíveis
4. ✅ Verificações de segurança em todos os pontos de entrada

## Como Verificar o Erro Exato

1. Ative o debug no `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

2. Verifique o log em: `wp-content/debug.log`

3. Se o erro persistir, verifique os logs do Apache/PHP:
   - Docker: `docker logs <container_name>`
   - Local: Verifique os logs do servidor web

## Teste Manual

Para isolar o problema:

1. Renomeie temporariamente a pasta do plugin: `ts-ml-integration` → `ts-ml-integration.bak`
2. Acesse `wp-admin/plugins.php` - deve funcionar
3. Se funcionar, o problema está no plugin
4. Renomeie de volta e verifique o `debug.log`
