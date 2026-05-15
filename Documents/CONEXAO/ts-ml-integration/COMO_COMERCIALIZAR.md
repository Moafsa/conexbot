# 💰 Guia Completo: Como Comercializar o Plugin

## 🎯 Visão Geral

Este guia explica como transformar seu plugin em um produto comercial com sistema de atualizações automáticas, licenciamento e vendas.

---

## 📋 Componentes Necessários

### 1. **Sistema de Atualizações Automáticas** ✅
- Já implementado em `includes/class-ts-ml-auto-updater.php`
- WordPress detecta atualizações automaticamente
- Usuário clica em "Atualizar" e instala automaticamente

### 2. **API de Atualizações** ⚠️
- Você precisa criar no seu servidor
- Veja exemplo em `api/class-ts-ml-update-api.php`
- Serve informações de versão e download

### 3. **Sistema de Licenciamento** 📝
- Validação de license keys
- Controle de sites ativos
- Expiração de licenses

### 4. **Sistema de Vendas** 💳
- Loja/E-commerce para vender licenses
- Integração com gateway de pagamento
- Geração automática de license keys

---

## 🏗️ Arquitetura Completa

```
┌─────────────────────────────────────────────────────────┐
│ LOJA (WooCommerce/Shopify/etc)                          │
├─────────────────────────────────────────────────────────┤
│ • Cliente compra plugin                                │
│ • Sistema gera license key                             │
│ • Envia email com license key                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ CLIENTE (Site WordPress)                                │
├─────────────────────────────────────────────────────────┤
│ • Instala plugin via ZIP                                │
│ • Insere license key nas configurações                 │
│ • Plugin valida license com sua API                    │
│ • WordPress verifica atualizações automaticamente      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ SUA API (Servidor)                                      │
├─────────────────────────────────────────────────────────┤
│ • Valida license keys                                   │
│ • Retorna informações de atualização                    │
│ • Serve downloads protegidos                            │
│ • Rastreia sites ativos                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Sistema de Licenciamento

### Banco de Dados

```sql
CREATE TABLE wp_ts_ml_licenses (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    license_key varchar(255) NOT NULL,
    order_id bigint(20),
    customer_email varchar(255),
    customer_name varchar(255),
    status varchar(20) DEFAULT 'active',
    license_type varchar(50) DEFAULT 'single', -- single, multi, lifetime
    site_limit int DEFAULT 1,
    sites_used text, -- JSON array de URLs
    expires_at datetime,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY license_key (license_key),
    KEY status (status),
    KEY expires_at (expires_at)
);
```

### Tipos de Licença

1. **Single Site:** 1 license = 1 site
2. **Multi-Site:** 1 license = 5 sites (configurável)
3. **Lifetime:** Sem expiração
4. **Anual:** Expira em 1 ano

---

## 🛒 Integração com Loja

### Opção 1: WooCommerce (Recomendado)

```php
// Quando pedido é completado
add_action('woocommerce_order_status_completed', 'ts_ml_generate_license');

function ts_ml_generate_license($order_id) {
    $order = wc_get_order($order_id);
    
    foreach ($order->get_items() as $item) {
        $product_id = $item->get_product_id();
        
        // Verificar se é produto de license
        if (get_post_meta($product_id, '_ts_ml_license_product', true)) {
            // Gerar license key
            $license_key = wp_generate_password(32, false);
            
            // Salvar no banco
            global $wpdb;
            $wpdb->insert($wpdb->prefix . 'ts_ml_licenses', array(
                'license_key' => $license_key,
                'order_id' => $order_id,
                'customer_email' => $order->get_billing_email(),
                'customer_name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                'license_type' => get_post_meta($product_id, '_ts_ml_license_type', true),
                'site_limit' => get_post_meta($product_id, '_ts_ml_site_limit', true),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+1 year')),
            ));
            
            // Enviar email com license
            ts_ml_send_license_email($order->get_billing_email(), $license_key);
        }
    }
}
```

### Opção 2: Sistema Customizado

```php
// Página de checkout customizada
function ts_ml_checkout_page() {
    // Processar pagamento (Stripe, PayPal, etc)
    // Gerar license após pagamento confirmado
    // Enviar email com license
}
```

---

## 📧 Email de License

```php
function ts_ml_send_license_email($email, $license_key) {
    $subject = 'Sua License Key - ToySport Mercado Livre Integration';
    
    $message = "
    <h2>Obrigado pela sua compra!</h2>
    
    <p>Sua license key é:</p>
    <p><strong style='font-size: 18px;'>{$license_key}</strong></p>
    
    <h3>Como usar:</h3>
    <ol>
        <li>Instale o plugin via WordPress Admin</li>
        <li>Vá em TS ML > Configurações</li>
        <li>Cole sua license key</li>
        <li>Clique em 'Ativar License'</li>
    </ol>
    
    <p>Suporte: suporte@toysport.com.br</p>
    ";
    
    wp_mail($email, $subject, $message, array('Content-Type: text/html; charset=UTF-8'));
}
```

---

## 🔄 Fluxo Completo de Venda

### 1. Cliente Compra:
```
Loja → Cliente compra plugin
     → Sistema gera license key
     → Email enviado com license
```

### 2. Cliente Instala:
```
Cliente → Baixa plugin (ZIP)
       → Instala no WordPress
       → Insere license key
       → Plugin valida license
       → ✅ License ativada
```

### 3. Atualizações Automáticas:
```
WordPress → Verifica atualizações (automático)
         → Faz requisição à sua API
         → API valida license
         → Retorna informações de atualização
         → WordPress mostra notificação
         → Cliente clica "Atualizar"
         → WordPress baixa e instala
```

---

## 💻 Implementação da API

### Endpoint Principal

```php
// No seu servidor (functions.php ou plugin)
add_action('rest_api_init', function() {
    register_rest_route('ts-ml/v1', '/updates', array(
        'methods' => 'POST',
        'callback' => 'ts_ml_update_api',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('ts-ml/v1', '/license', array(
        'methods' => 'POST',
        'callback' => 'ts_ml_license_api',
        'permission_callback' => '__return_true'
    ));
});

function ts_ml_update_api($request) {
    $action = $request->get_param('action');
    $license_key = $request->get_param('license_key');
    $site_url = $request->get_param('site_url');
    
    // Validar license
    if (!ts_ml_validate_license($license_key, $site_url)) {
        return new WP_Error('invalid_license', 'License inválida ou expirada', array('status' => 403));
    }
    
    // Retornar informações de atualização
    return array(
        'version' => '1.1.0',
        'download_url' => ts_ml_get_download_url($license_key),
        'changelog' => '...',
    );
}

function ts_ml_license_api($request) {
    $action = $request->get_param('action');
    $license_key = $request->get_param('license_key');
    $site_url = $request->get_param('site_url');
    
    switch ($action) {
        case 'activate':
            return ts_ml_activate_license($license_key, $site_url);
        case 'deactivate':
            return ts_ml_deactivate_license($license_key, $site_url);
        case 'check':
            return ts_ml_check_license($license_key, $site_url);
    }
}
```

---

## 🎨 Interface no Plugin

### Página de Configurações de License

```php
// Adicionar em admin/views/settings.php
?>
<div class="ts-ml-license-section">
    <h2>License Key</h2>
    
    <?php if (empty($license_key)): ?>
        <p>Insira sua license key para ativar atualizações automáticas.</p>
        <input type="text" name="ts_ml_license_key" placeholder="Sua License Key" />
        <button class="button button-primary" id="activate-license">Ativar License</button>
    <?php else: ?>
        <p>✅ License ativa: <strong><?php echo esc_html($license_key); ?></strong></p>
        <p>Status: <span id="license-status">Verificando...</span></p>
        <button class="button" id="deactivate-license">Desativar License</button>
    <?php endif; ?>
</div>

<script>
jQuery('#activate-license').on('click', function() {
    var licenseKey = jQuery('input[name="ts_ml_license_key"]').val();
    
    jQuery.post(ajaxurl, {
        action: 'ts_ml_activate_license',
        license_key: licenseKey,
        nonce: '<?php echo wp_create_nonce("ts_ml_license"); ?>'
    }, function(response) {
        if (response.success) {
            alert('License ativada com sucesso!');
            location.reload();
        } else {
            alert('Erro: ' + response.data);
        }
    });
});
</script>
<?php
```

---

## 📊 Rastreamento e Analytics

### Métricas Importantes:

1. **Licenses Vendidas**
2. **Licenses Ativas**
3. **Sites Ativos**
4. **Taxa de Renovação**
5. **Versões em Uso**
6. **Downloads por Versão**

### Dashboard de Licenses:

```php
function ts_ml_license_dashboard() {
    global $wpdb;
    $table = $wpdb->prefix . 'ts_ml_licenses';
    
    $stats = array(
        'total' => $wpdb->get_var("SELECT COUNT(*) FROM $table"),
        'active' => $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE status = 'active'"),
        'expired' => $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE expires_at < NOW()"),
        'sites_active' => $wpdb->get_var("SELECT SUM(site_limit) FROM $table WHERE status = 'active'"),
    );
    
    return $stats;
}
```

---

## 🔒 Segurança

### Boas Práticas:

1. **HTTPS obrigatório** para API
2. **Validação de nonces** em todas as requisições
3. **Rate limiting** na API
4. **Logs de acesso** à API
5. **Criptografia** de dados sensíveis
6. **Tokens temporários** para downloads

---

## 💡 Modelos de Preço

### 1. **Preço Único:**
- R$ 299,00 - License única
- 1 site
- Atualizações por 1 ano

### 2. **Plano Anual:**
- R$ 199,00/ano - License única
- 1 site
- Renovação automática

### 3. **Plano Lifetime:**
- R$ 999,00 - License vitalícia
- 1 site
- Atualizações para sempre

### 4. **Plano Multi-Site:**
- R$ 499,00 - License multi-site
- 5 sites
- Atualizações por 1 ano

---

## 📚 Recursos Adicionais

### Plugins de Ajuda:

- **Easy Digital Downloads** - Sistema de vendas
- **WooCommerce Software License** - Licenciamento
- **EDD Software Licensing** - Licenciamento avançado

### Serviços Externos:

- **Freemius** - Plataforma completa (vendas + licenciamento)
- **SellWP** - Sistema de licenciamento
- **WP Remote** - Gerenciamento de licenses

---

## ✅ Checklist para Lançamento

- [ ] **API de atualizações** configurada
- [ ] **Sistema de licenciamento** implementado
- [ ] **Banco de dados** criado
- [ ] **Loja/E-commerce** configurada
- [ ] **Gateway de pagamento** integrado
- [ ] **Emails automáticos** configurados
- [ ] **Página de documentação** criada
- [ ] **Suporte** preparado
- [ ] **Termos de uso** definidos
- [ ] **Política de reembolso** definida
- [ ] **Testes** completos realizados

---

## 🚀 Próximos Passos

1. **Configure a API** no seu servidor
2. **Crie sistema de licenciamento** (ou use plugin)
3. **Configure loja** para vendas
4. **Teste tudo** em ambiente de staging
5. **Lance** o produto!

---

**Última atualização:** Janeiro 2026
