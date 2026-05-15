# 🔧 Como Configurar a API de Atualizações no Servidor

## 🎯 O Que Você Precisa Fazer

Você precisa criar um **endpoint REST API** no seu servidor que retorna informações sobre atualizações do plugin.

---

## 📋 Passo a Passo Completo

### 1️⃣ **Escolher Onde Criar a API**

Você tem 3 opções:

#### **Opção A: No Mesmo WordPress (Recomendado)**
- Crie um plugin simples ou adicione ao `functions.php` do tema
- Mais fácil de gerenciar
- Usa WordPress REST API

#### **Opção B: WordPress Separado**
- WordPress dedicado apenas para API
- Melhor para múltiplos plugins
- Mais profissional

#### **Opção C: Arquivo PHP Standalone**
- Arquivo PHP simples no servidor
- Não precisa WordPress
- Mais leve

---

## 🚀 Opção A: WordPress REST API (Recomendado)

### Passo 1: Criar Plugin de API

Crie um arquivo `ts-ml-update-api.php` no servidor:

```php
<?php
/**
 * Plugin Name: TS ML Update API
 * Description: API de atualizações para TS-ML Integration
 * Version: 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Registrar endpoint REST API
add_action('rest_api_init', function() {
    register_rest_route('ts-ml/v1', '/updates', array(
        'methods' => 'POST',
        'callback' => 'ts_ml_update_api_handler',
        'permission_callback' => '__return_true' // Público, mas você pode proteger
    ));
});

/**
 * Handler da API de atualizações
 */
function ts_ml_update_api_handler($request) {
    $action = $request->get_param('action');
    $plugin = $request->get_param('plugin');
    $version = $request->get_param('version');
    $license_key = $request->get_param('license_key');
    $site_url = $request->get_param('site_url');
    
    // Validar que é nosso plugin
    if ($plugin !== 'ts-ml-integration') {
        return new WP_Error('invalid_plugin', 'Plugin inválido', array('status' => 400));
    }
    
    // Processar ação
    switch ($action) {
        case 'version_check':
            return ts_ml_get_update_info($version, $license_key, $site_url);
            
        case 'update_success':
            // Log de atualização bem-sucedida
            ts_ml_log_update($site_url, $version);
            return array('success' => true);
            
        default:
            return new WP_Error('invalid_action', 'Ação inválida', array('status' => 400));
    }
}

/**
 * Retorna informações de atualização
 */
function ts_ml_get_update_info($current_version, $license_key, $site_url) {
    // CONFIGURE AQUI: Versão mais recente disponível
    $latest_version = '1.1.0';
    
    // CONFIGURE AQUI: URL de download do ZIP
    $download_url = 'https://seusite.com.br/downloads/ts-ml-integration-' . $latest_version . '.zip';
    
    // Verificar se há atualização disponível
    if (version_compare($current_version, $latest_version, '>=')) {
        return array(
            'version' => $latest_version,
            'update_available' => false
        );
    }
    
    // Validar license (se plugin comercial)
    // Para plugin gratuito, pode pular esta validação
    if (!empty($license_key)) {
        $license_valid = ts_ml_validate_license($license_key, $site_url);
        if (!$license_valid) {
            return new WP_Error('invalid_license', 'License inválida ou expirada', array('status' => 403));
        }
    }
    
    // Retornar informações de atualização
    return array(
        'version' => $latest_version,
        'update_available' => true,
        'homepage' => 'https://seusite.com.br',
        'download_url' => $download_url,
        'requires' => '6.8',
        'tested' => '6.8',
        'requires_php' => '8.2',
        'last_updated' => '2026-01-20',
        'sections' => array(
            'description' => '<p>Integração completa entre WooCommerce e Mercado Livre...</p>',
            'changelog' => ts_ml_get_changelog($latest_version),
        ),
    );
}

/**
 * Obter changelog da versão
 */
function ts_ml_get_changelog($version) {
    $changelogs = array(
        '1.1.0' => '
            <h4>Versão 1.1.0 - 2026-01-20</h4>
            <ul>
                <li><strong>Novo:</strong> Suporte a variações de produtos</li>
                <li><strong>Correção:</strong> Bug na sincronização de preços</li>
            </ul>
        ',
    );
    
    return isset($changelogs[$version]) ? $changelogs[$version] : '';
}

/**
 * Validar license key (para plugins comerciais)
 */
function ts_ml_validate_license($license_key, $site_url) {
    // Para plugin gratuito, retorne true
    // Para plugin comercial, implemente validação aqui
    
    // Exemplo básico:
    global $wpdb;
    $table = $wpdb->prefix . 'ts_ml_licenses';
    
    $license = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table WHERE license_key = %s AND status = 'active'",
        $license_key
    ));
    
    return $license !== null;
}

/**
 * Log de atualização
 */
function ts_ml_log_update($site_url, $version) {
    // Opcional: Log de atualizações bem-sucedidas
    error_log("TS ML Update: {$site_url} atualizado para versão {$version}");
}

```

### Passo 2: Instalar no Servidor

1. **Crie pasta do plugin:**
   ```bash
   mkdir -p /var/www/html/wp-content/plugins/ts-ml-update-api
   ```

2. **Salve o arquivo:**
   ```bash
   # Salve ts-ml-update-api.php na pasta criada
   ```

3. **Ative o plugin:**
   - WordPress Admin > Plugins > Ativar "TS ML Update API"

### Passo 3: Testar a API

```bash
curl -X POST https://seusite.com.br/wp-json/ts-ml/v1/updates \
  -H "Content-Type: application/json" \
  -d '{
    "action": "version_check",
    "plugin": "ts-ml-integration",
    "version": "1.0.0",
    "license_key": "",
    "site_url": "https://cliente.com.br"
  }'
```

**Resposta esperada:**
```json
{
    "version": "1.1.0",
    "update_available": true,
    "download_url": "https://seusite.com.br/downloads/ts-ml-integration-1.1.0.zip",
    "homepage": "https://seusite.com.br",
    ...
}
```

---

## 🔧 Opção B: Arquivo PHP Standalone

### Criar arquivo `update-api.php` no servidor:

```php
<?php
/**
 * API de Atualizações TS-ML Integration
 * Coloque este arquivo em: https://seusite.com.br/api/update-api.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Processar apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('error' => 'Method not allowed'));
    exit;
}

// Obter dados
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_POST['action'] ?? '';
$version = $input['version'] ?? $_POST['version'] ?? '1.0.0';
$license_key = $input['license_key'] ?? $_POST['license_key'] ?? '';

// CONFIGURE AQUI: Versão mais recente
$latest_version = '1.1.0';

// CONFIGURE AQUI: URL de download
$download_url = 'https://seusite.com.br/downloads/ts-ml-integration-' . $latest_version . '.zip';

if ($action === 'version_check') {
    // Verificar se há atualização
    if (version_compare($version, $latest_version, '>=')) {
        echo json_encode(array(
            'version' => $latest_version,
            'update_available' => false
        ));
        exit;
    }
    
    // Retornar informações de atualização
    echo json_encode(array(
        'version' => $latest_version,
        'update_available' => true,
        'homepage' => 'https://seusite.com.br',
        'download_url' => $download_url,
        'requires' => '6.8',
        'tested' => '6.8',
        'requires_php' => '8.2',
        'last_updated' => '2026-01-20',
        'sections' => array(
            'description' => '<p>Integração completa entre WooCommerce e Mercado Livre...</p>',
            'changelog' => '<h4>Versão ' . $latest_version . '</h4><ul><li>Novas funcionalidades</li></ul>',
        ),
    ));
} else {
    http_response_code(400);
    echo json_encode(array('error' => 'Invalid action'));
}
```

### Configurar no Plugin:

No arquivo `includes/class-ts-ml-auto-updater.php`, a URL será configurada automaticamente ou você pode definir:

```php
// No wp-config.php ou no plugin
define('TS_ML_UPDATE_API_URL', 'https://seusite.com.br/api/update-api.php');
```

---

## ⚙️ Configurar URL no Plugin

### Método 1: Via Constante (Recomendado)

Adicione no `wp-config.php` do **cliente** (não do servidor):

```php
// wp-config.php
define('TS_ML_UPDATE_API_URL', 'https://seusite.com.br/wp-json/ts-ml/v1/updates');
```

### Método 2: Via Update URI (Automático)

O plugin já extrai automaticamente do header `Update URI`:

```php
/**
 * Update URI: https://seusite.com.br/updates/ts-ml-integration
 */
```

O plugin converte automaticamente para:
```
https://seusite.com.br/wp-json/ts-ml/v1/updates
```

### Método 3: Via Configurações do Plugin

Adicione campo nas configurações do plugin:

```php
// Em admin/views/settings.php
?>
<tr>
    <th><label>URL da API de Atualizações</label></th>
    <td>
        <input type="url" name="ts_ml_settings[update_api_url]" 
               value="<?php echo esc_attr($settings['update_api_url'] ?? ''); ?>" 
               placeholder="https://seusite.com.br/wp-json/ts-ml/v1/updates" />
        <p class="description">URL da API que fornece informações de atualização</p>
    </td>
</tr>
<?php
```

---

## 📍 Onde Colocar Cada Coisa

### No Servidor (Sua API):
```
seusite.com.br/
├── wp-content/
│   └── plugins/
│       └── ts-ml-update-api/
│           └── ts-ml-update-api.php  ← API aqui
└── downloads/
    └── ts-ml-integration-1.1.0.zip   ← ZIPs aqui
```

### No Cliente (Site do Cliente):
```
cliente.com.br/
└── wp-content/
    └── plugins/
        └── ts-ml-integration/
            └── ts-ml-integration.php  ← Plugin aqui
```

---

## 🔍 Verificar se Está Funcionando

### 1. Testar API Manualmente:

```bash
# Teste básico
curl -X POST https://seusite.com.br/wp-json/ts-ml/v1/updates \
  -d "action=version_check" \
  -d "plugin=ts-ml-integration" \
  -d "version=1.0.0"
```

### 2. Verificar no WordPress do Cliente:

```php
// Via código
delete_transient('update_plugins');
wp_update_plugins();

// Verificar transients
$updates = get_site_transient('update_plugins');
print_r($updates);
```

### 3. Via WP-CLI:

```bash
wp plugin list --update=available
```

---

## 🎯 Configuração Rápida (Resumo)

### 1. No Seu Servidor:
```php
// Criar plugin ts-ml-update-api.php
// Configurar versão mais recente: $latest_version = '1.1.0';
// Configurar URL de download: $download_url = 'https://seusite.com.br/downloads/...';
```

### 2. No Plugin (Cliente):
```php
// Mudar Update URI no cabeçalho:
Update URI: https://seusite.com.br/updates/ts-ml-integration

// OU definir constante:
define('TS_ML_UPDATE_API_URL', 'https://seusite.com.br/wp-json/ts-ml/v1/updates');
```

### 3. Testar:
```bash
curl -X POST https://seusite.com.br/wp-json/ts-ml/v1/updates -d "action=version_check&version=1.0.0"
```

---

## 📝 Checklist

- [ ] **API criada** no servidor
- [ ] **URL configurada** no plugin (Update URI ou constante)
- [ ] **Versão mais recente** definida na API
- [ ] **URL de download** configurada
- [ ] **API testada** manualmente
- [ ] **Plugin testado** no WordPress do cliente
- [ ] **Notificação de atualização** aparece corretamente

---

## 🔗 URLs Importantes

### Update URI (no plugin):
```
https://seusite.com.br/updates/ts-ml-integration
```

### API Endpoint (onde WordPress faz requisição):
```
https://seusite.com.br/wp-json/ts-ml/v1/updates
```

### Download do ZIP:
```
https://seusite.com.br/downloads/ts-ml-integration-1.1.0.zip
```

---

**Última atualização:** Janeiro 2026
