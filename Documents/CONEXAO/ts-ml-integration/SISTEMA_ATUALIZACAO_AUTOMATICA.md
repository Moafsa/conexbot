# 🚀 Sistema de Atualização Automática - Como Plugins Comerciais Funcionam

## 🎯 Como Plugins Comerciais Detectam Atualizações

Plugins comerciais (como WooCommerce, Elementor, etc) usam o sistema **Update URI** do WordPress para detectar atualizações automaticamente. Aqui está como funciona:

---

## 🔄 Como Funciona

### 1. **WordPress Verifica Atualizações Automaticamente**

WordPress verifica atualizações de plugins periodicamente:
- Quando você acessa **Plugins > Plugins Instalados**
- Quando você acessa **Dashboard > Atualizações**
- Via cron job (a cada 12 horas)
- Quando você clica em "Verificar atualizações"

### 2. **WordPress Lê o Header "Update URI"**

No cabeçalho do plugin:
```php
/**
 * Update URI: https://toysport.com.br/updates/ts-ml-integration
 */
```

WordPress usa essa URL para verificar atualizações **em vez** de usar WordPress.org.

### 3. **WordPress Faz Requisição à Sua API**

WordPress envia uma requisição POST para sua API com:
```json
{
    "action": "version_check",
    "plugin": "ts-ml-integration",
    "version": "1.0.0",
    "license_key": "abc123...",
    "site_url": "https://cliente.com.br",
    "wp_version": "6.8",
    "php_version": "8.2"
}
```

### 4. **Sua API Retorna Informações de Atualização**

Sua API responde com:
```json
{
    "version": "1.1.0",
    "update_available": true,
    "download_url": "https://toysport.com.br/download/ts-ml-integration-1.1.0.zip?token=xyz",
    "homepage": "https://toysport.com.br/plugin",
    "changelog": "...",
    "requires": "6.8",
    "tested": "6.8"
}
```

### 5. **WordPress Mostra Notificação**

Se há atualização disponível:
- ✅ Mostra notificação no Dashboard
- ✅ Mostra botão "Atualizar agora" em Plugins
- ✅ Usuário clica e WordPress baixa/instala automaticamente

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│ CLIENTE (Site WordPress)                                │
├─────────────────────────────────────────────────────────┤
│ • Plugin instalado (versão 1.0.0)                      │
│ • Header: Update URI: https://toysport.com.br/updates  │
│ • WordPress verifica atualizações automaticamente       │
└─────────────────────────────────────────────────────────┘
                        ↓ HTTP POST
┌─────────────────────────────────────────────────────────┐
│ SERVIDOR (Sua API)                                      │
├─────────────────────────────────────────────────────────┤
│ • Recebe requisição com versão atual                    │
│ • Valida license key (se comercial)                     │
│ • Compara versão atual vs versão mais recente           │
│ • Retorna informações de atualização                    │
└─────────────────────────────────────────────────────────┘
                        ↓ JSON Response
┌─────────────────────────────────────────────────────────┐
│ CLIENTE (WordPress)                                     │
├─────────────────────────────────────────────────────────┤
│ • WordPress recebe resposta                            │
│ • Detecta que há atualização disponível                │
│ • Mostra notificação ao usuário                        │
│ • Usuário clica "Atualizar"                            │
│ • WordPress baixa ZIP da sua API                       │
│ • WordPress instala automaticamente                    │
│ • Sistema de migração executa automaticamente          │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Implementação Completa

### 1. **No Plugin (Já Implementado)**

✅ **Arquivo:** `includes/class-ts-ml-auto-updater.php`
- Verifica atualizações remotas
- Integra com sistema de atualização do WordPress
- Valida license key
- Mostra informações de atualização

### 2. **No Servidor (Você Precisa Criar)**

Crie um endpoint REST API no seu servidor:

**Opção A: WordPress REST API (Recomendado)**
```php
// Adicione ao functions.php do seu tema ou plugin de API
add_action('rest_api_init', function() {
    register_rest_route('ts-ml/v1', '/updates', array(
        'methods' => 'POST',
        'callback' => 'ts_ml_update_api_handler',
        'permission_callback' => '__return_true'
    ));
});

function ts_ml_update_api_handler($request) {
    $action = $request->get_param('action');
    $version = $request->get_param('version');
    $license_key = $request->get_param('license_key');
    
    // Validar license
    if (!ts_ml_validate_license($license_key)) {
        return new WP_Error('invalid_license', 'License invalid', array('status' => 403));
    }
    
    // Retornar informações de atualização
    return array(
        'version' => '1.1.0',
        'download_url' => 'https://toysport.com.br/downloads/ts-ml-integration-1.1.0.zip',
        'homepage' => 'https://toysport.com.br',
        'changelog' => '...',
    );
}
```

**Opção B: Arquivo PHP Standalone**
```php
<?php
// update-api.php no seu servidor
header('Content-Type: application/json');

$action = $_POST['action'] ?? '';
$version = $_POST['version'] ?? '';

if ($action === 'version_check') {
    echo json_encode(array(
        'version' => '1.1.0',
        'download_url' => 'https://toysport.com.br/downloads/ts-ml-integration-1.1.0.zip',
        'homepage' => 'https://toysport.com.br',
    ));
}
```

---

## 🔐 Sistema de Licenciamento (Para Plugins Comerciais)

### Estrutura de Banco de Dados

```sql
CREATE TABLE wp_ts_ml_licenses (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    license_key varchar(255) NOT NULL,
    email varchar(255),
    status varchar(20) DEFAULT 'active',
    expires_at datetime,
    site_limit int DEFAULT 1,
    sites_used text,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY license_key (license_key)
);
```

### Validação de License

```php
function ts_ml_validate_license($license_key, $site_url) {
    global $wpdb;
    $table = $wpdb->prefix . 'ts_ml_licenses';
    
    $license = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table WHERE license_key = %s AND status = 'active'",
        $license_key
    ));
    
    if (!$license) {
        return false;
    }
    
    // Verificar expiração
    if ($license->expires_at && strtotime($license->expires_at) < time()) {
        return false;
    }
    
    // Verificar limite de sites
    $sites = json_decode($license->sites_used, true) ?: array();
    if (count($sites) >= $license->site_limit && !in_array($site_url, $sites)) {
        return false;
    }
    
    return true;
}
```

---

## 📦 Estrutura de Download

### Para Plugins Gratuitos:
```
https://toysport.com.br/downloads/ts-ml-integration-1.1.0.zip
```

### Para Plugins Comerciais (com License):
```
https://toysport.com.br/download/ts-ml-integration?token=xyz&version=1.1.0
```

O token é gerado temporariamente e valida:
- License key válida
- Site autorizado
- Versão solicitada

---

## 🎨 Interface no WordPress Admin

Quando há atualização disponível:

### Dashboard:
```
┌─────────────────────────────────────────┐
│ ⚠️ Atualização Disponível               │
│                                         │
│ ToySport Mercado Livre Integration     │
│ Versão 1.1.0 disponível                │
│ [Atualizar Agora]                      │
└─────────────────────────────────────────┘
```

### Página de Plugins:
```
┌─────────────────────────────────────────┐
│ ToySport Mercado Livre Integration     │
│ Versão 1.0.0 instalada                 │
│ ⚠️ Nova versão 1.1.0 disponível        │
│ [Atualizar agora]                      │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuração no Plugin

### 1. Ativar Sistema de Atualização Automática

O sistema já está implementado! Basta:

1. **Configurar Update URI** (já está no cabeçalho):
   ```php
   Update URI: https://toysport.com.br/updates/ts-ml-integration
   ```

2. **Criar API no Servidor** (você precisa fazer):
   - Use o arquivo `api/class-ts-ml-update-api.php` como exemplo
   - Configure no seu servidor
   - Teste a API

3. **Configurar License Key** (opcional, para comerciais):
   ```php
   // No plugin settings
   $settings['license_key'] = 'abc123...';
   update_option('ts_ml_settings', $settings);
   ```

---

## 📊 Fluxo Completo de Atualização

### 1. Desenvolvimento:
```bash
# Você desenvolve nova versão
# Atualiza versão: 1.0.0 → 1.1.0
# Cria ZIP: ts-ml-integration-1.1.0.zip
# Faz upload para servidor
# Atualiza API para retornar versão 1.1.0
```

### 2. Cliente (Automaticamente):
```
WordPress verifica atualizações
  ↓
Faz requisição à sua API
  ↓
API retorna: "versão 1.1.0 disponível"
  ↓
WordPress mostra notificação
  ↓
Cliente clica "Atualizar"
  ↓
WordPress baixa ZIP automaticamente
  ↓
WordPress instala automaticamente
  ↓
Sistema de migração executa
  ↓
✅ Plugin atualizado!
```

---

## 🧪 Testar o Sistema

### 1. Testar API Manualmente:

```bash
curl -X POST https://toysport.com.br/wp-json/ts-ml/v1/updates \
  -d "action=version_check" \
  -d "plugin=ts-ml-integration" \
  -d "version=1.0.0" \
  -d "license_key=test"
```

### 2. Forçar Verificação no WordPress:

```php
// Via código
delete_transient('update_plugins');
wp_update_plugins();

// Via WP-CLI
wp plugin list --update=available
```

### 3. Verificar Logs:

```php
// Ver transients de atualização
get_site_transient('update_plugins');
```

---

## 💰 Modelos de Licenciamento

### 1. **Plugin Gratuito:**
- Sem license key
- Atualizações para todos
- API simples

### 2. **Plugin Comercial - Licença Única:**
- 1 license key = 1 site
- Validação por site URL
- Download protegido

### 3. **Plugin Comercial - Licença Multi-Site:**
- 1 license key = N sites
- Rastreamento de sites
- Limite configurável

### 4. **Plugin Comercial - Assinatura:**
- License expira em X dias
- Renovação automática
- Acesso apenas enquanto válido

---

## 📚 Exemplo Completo de API

Veja o arquivo `api/class-ts-ml-update-api.php` para exemplo completo de implementação da API.

---

## ✅ Checklist para Lançamento Comercial

- [ ] **API de atualizações configurada** no servidor
- [ ] **Sistema de licenciamento** implementado
- [ ] **Banco de dados** de licenses criado
- [ ] **Download protegido** por license
- [ ] **Validação de license** funcionando
- [ ] **Changelog** atualizado
- [ ] **Banners e ícones** preparados
- [ ] **Testes** realizados
- [ ] **Documentação** completa

---

## 🔗 Recursos Adicionais

- **WordPress Update API:** https://developer.wordpress.org/plugins/plugin-basics/updating-a-plugin/
- **Update URI Header:** https://make.wordpress.org/core/2021/06/29/introducing-update-uri-plugin-header-in-wordpress-5-8/
- **REST API:** https://developer.wordpress.org/rest-api/

---

**Última atualização:** Janeiro 2026
