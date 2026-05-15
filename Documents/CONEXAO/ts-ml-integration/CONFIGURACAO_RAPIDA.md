# ⚡ Configuração Rápida - API de Atualizações

## 🎯 Resumo em 3 Passos

### 1️⃣ **Mudar URL no Plugin**

**Arquivo:** `ts-ml-integration.php` (linha 15)

```php
/**
 * Update URI: https://SEU-SERVIDOR.com.br/updates/ts-ml-integration
 */
```

**Substitua `SEU-SERVIDOR.com.br` pelo domínio do seu servidor!**

---

### 2️⃣ **Criar API no Servidor**

**Opção A: WordPress REST API** (Recomendado)

Crie arquivo `ts-ml-update-api.php` no servidor:

```php
<?php
/**
 * Plugin Name: TS ML Update API
 */

add_action('rest_api_init', function() {
    register_rest_route('ts-ml/v1', '/updates', array(
        'methods' => 'POST',
        'callback' => 'ts_ml_update_api',
        'permission_callback' => '__return_true'
    ));
});

function ts_ml_update_api($request) {
    // CONFIGURE AQUI: Versão mais recente
    $latest_version = '1.1.0';
    
    // CONFIGURE AQUI: URL de download
    $download_url = 'https://seusite.com.br/downloads/ts-ml-integration-' . $latest_version . '.zip';
    
    $current_version = $request->get_param('version');
    
    if (version_compare($current_version, $latest_version, '>=')) {
        return array('version' => $latest_version, 'update_available' => false);
    }
    
    return array(
        'version' => $latest_version,
        'update_available' => true,
        'download_url' => $download_url,
        'homepage' => 'https://seusite.com.br',
        'requires' => '6.8',
        'tested' => '6.8',
    );
}
```

**Instalar:**
- Salve em: `/wp-content/plugins/ts-ml-update-api/ts-ml-update-api.php`
- Ative o plugin no WordPress Admin

**Opção B: Arquivo PHP Standalone**

Use o arquivo `api/update-api-standalone.php` fornecido.

1. Copie para seu servidor: `https://seusite.com.br/api/update-api.php`
2. Edite as configurações no topo do arquivo
3. Pronto!

---

### 3️⃣ **Testar**

```bash
curl -X POST https://seusite.com.br/wp-json/ts-ml/v1/updates \
  -d "action=version_check&version=1.0.0&plugin=ts-ml-integration"
```

**Deve retornar:**
```json
{
    "version": "1.1.0",
    "update_available": true,
    "download_url": "https://seusite.com.br/downloads/ts-ml-integration-1.1.0.zip"
}
```

---

## 📋 O Que Mudar

### No Plugin (Cliente):
- ✅ Update URI: `https://SEU-SERVIDOR.com.br/updates/ts-ml-integration`

### Na API (Servidor):
- ✅ Versão mais recente: `$latest_version = '1.1.0';`
- ✅ URL de download: `$download_url = 'https://seusite.com.br/downloads/...';`

---

## 🔍 Verificar se Funcionou

1. **Instale plugin** no WordPress do cliente
2. **Acesse:** Plugins > Plugins Instalados
3. **Clique:** "Verificar atualizações"
4. **Deve aparecer:** Notificação de atualização disponível

---

## 📚 Documentação Completa

- **Configuração Detalhada:** `CONFIGURAR_API_SERVIDOR.md`
- **Configurar URL:** `CONFIGURAR_URL.md`
- **Sistema Completo:** `SISTEMA_ATUALIZACAO_AUTOMATICA.md`

---

**Última atualização:** Janeiro 2026
