# 📝 Exemplo Completo de Configuração

## 🎯 Cenário: Você Tem um Servidor

**Seu servidor:** `api.meusite.com.br`  
**Servidor do cliente:** `cliente.com.br`

---

## 📋 Passo a Passo Completo

### 1️⃣ **No Seu Servidor (api.meusite.com.br)**

#### Criar Plugin de API:

**Arquivo:** `/var/www/html/wp-content/plugins/ts-ml-update-api/ts-ml-update-api.php`

```php
<?php
/**
 * Plugin Name: TS ML Update API
 * Description: API de atualizações para TS-ML Integration
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function() {
    register_rest_route('ts-ml/v1', '/updates', array(
        'methods' => 'POST',
        'callback' => 'ts_ml_update_api',
        'permission_callback' => '__return_true'
    ));
});

function ts_ml_update_api($request) {
    // CONFIGURE AQUI: Versão mais recente disponível
    $latest_version = '1.1.0';
    
    // CONFIGURE AQUI: Onde estão os ZIPs
    $download_url = 'https://api.meusite.com.br/downloads/ts-ml-integration-' . $latest_version . '.zip';
    
    $current_version = $request->get_param('version') ?: '1.0.0';
    
    // Se já está na versão mais recente
    if (version_compare($current_version, $latest_version, '>=')) {
        return array(
            'version' => $latest_version,
            'update_available' => false
        );
    }
    
    // Retornar informações de atualização
    return array(
        'version' => $latest_version,
        'update_available' => true,
        'homepage' => 'https://meusite.com.br',
        'download_url' => $download_url,
        'requires' => '6.8',
        'tested' => '6.8',
        'requires_php' => '8.2',
        'last_updated' => '2026-01-20',
        'sections' => array(
            'description' => '<p>Integração completa entre WooCommerce e Mercado Livre...</p>',
            'changelog' => '<h4>Versão ' . $latest_version . '</h4><ul><li>Novas funcionalidades</li></ul>',
        ),
    );
}
```

**Ativar plugin:**
- WordPress Admin > Plugins > Ativar "TS ML Update API"

#### Criar Pasta de Downloads:

```bash
mkdir -p /var/www/html/downloads
chmod 755 /var/www/html/downloads
```

**Colocar ZIPs aqui:**
```
/var/www/html/downloads/
├── ts-ml-integration-1.0.0.zip
├── ts-ml-integration-1.1.0.zip
└── ts-ml-integration-1.2.0.zip
```

---

### 2️⃣ **No Plugin (Cliente)**

#### Mudar Update URI:

**Arquivo:** `ts-ml-integration.php` (linha 15)

```php
/**
 * Update URI: https://api.meusite.com.br/updates/ts-ml-integration
 */
```

O plugin automaticamente converte para:
```
https://api.meusite.com.br/wp-json/ts-ml/v1/updates
```

---

### 3️⃣ **Testar**

#### Testar API:

```bash
curl -X POST https://api.meusite.com.br/wp-json/ts-ml/v1/updates \
  -H "Content-Type: application/json" \
  -d '{
    "action": "version_check",
    "plugin": "ts-ml-integration",
    "version": "1.0.0"
  }'
```

**Resposta esperada:**
```json
{
    "version": "1.1.0",
    "update_available": true,
    "download_url": "https://api.meusite.com.br/downloads/ts-ml-integration-1.1.0.zip",
    "homepage": "https://meusite.com.br"
}
```

#### Testar no WordPress:

1. Instale plugin no WordPress do cliente
2. Acesse: **Plugins > Plugins Instalados**
3. Clique: **"Verificar atualizações"**
4. Deve aparecer: **"Nova versão 1.1.0 disponível"**

---

## 🔄 Quando Atualizar Versão

### Quando você lançar versão 1.2.0:

1. **No servidor, edite API:**
   ```php
   $latest_version = '1.2.0';  // Mudar aqui
   $download_url = 'https://api.meusite.com.br/downloads/ts-ml-integration-1.2.0.zip';
   ```

2. **Faça upload do ZIP:**
   ```bash
   # Upload para servidor
   scp ts-ml-integration-1.2.0.zip usuario@api.meusite.com.br:/var/www/html/downloads/
   ```

3. **Pronto!** Clientes receberão notificação automaticamente

---

## 📍 Estrutura Completa

### No Seu Servidor:
```
api.meusite.com.br/
├── wp-content/
│   └── plugins/
│       └── ts-ml-update-api/
│           └── ts-ml-update-api.php  ← API aqui
└── downloads/
    ├── ts-ml-integration-1.0.0.zip
    ├── ts-ml-integration-1.1.0.zip
    └── ts-ml-integration-1.2.0.zip   ← ZIPs aqui
```

### No Cliente:
```
cliente.com.br/
└── wp-content/
    └── plugins/
        └── ts-ml-integration/
            └── ts-ml-integration.php  ← Plugin aqui
```

---

## ✅ Checklist

- [ ] **API criada** no servidor
- [ ] **Plugin de API ativado** no WordPress do servidor
- [ ] **Pasta downloads criada** no servidor
- [ ] **Update URI configurado** no plugin do cliente
- [ ] **API testada** manualmente
- [ ] **Plugin testado** no WordPress do cliente
- [ ] **Notificação de atualização** funciona

---

## 🚨 Problemas Comuns

### API não responde:

1. Verifique se plugin está ativado
2. Verifique URL: `https://api.meusite.com.br/wp-json/ts-ml/v1/updates`
3. Teste com curl manualmente
4. Verifique logs do servidor

### WordPress não detecta atualização:

1. Limpe cache: `delete_transient('update_plugins')`
2. Force verificação: `wp_update_plugins()`
3. Verifique Update URI no cabeçalho do plugin
4. Verifique se API está retornando JSON válido

### Download falha:

1. Verifique se ZIP existe no servidor
2. Verifique permissões do arquivo (644)
3. Verifique URL de download na resposta da API
4. Teste download manualmente no navegador

---

**Última atualização:** Janeiro 2026
