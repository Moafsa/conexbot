# ✅ Resumo: Como Configurar no Servidor

## 🎯 Resposta Direta

> **"Como eu configuro no servidor? E por que está essa URL aí?"**

### Por Que Está "toysport.com.br"?

Essa é uma **URL de exemplo**. Você **DEVE mudar** para o seu servidor!

---

## 📋 O Que Fazer

### 1️⃣ **Mudar URL no Plugin** (2 minutos)

**Arquivo:** `ts-ml-integration.php` (linha 15)

**Mude:**
```php
Update URI: https://toysport.com.br/updates/ts-ml-integration
```

**Para:**
```php
Update URI: https://SEU-SERVIDOR.com.br/updates/ts-ml-integration
```

**Substitua `SEU-SERVIDOR.com.br` pelo seu domínio!**

---

### 2️⃣ **Criar API no Servidor** (10 minutos)

#### Opção A: WordPress REST API (Recomendado)

**Criar arquivo:** `ts-ml-update-api.php`

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
    
    $current_version = $request->get_param('version') ?: '1.0.0';
    
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
1. Salve em: `/wp-content/plugins/ts-ml-update-api/ts-ml-update-api.php`
2. Ative no WordPress Admin

#### Opção B: Arquivo PHP Standalone

Use o arquivo `api/update-api-standalone.php` fornecido.

1. Copie para: `https://seusite.com.br/api/update-api.php`
2. Edite configurações no topo
3. Pronto!

---

### 3️⃣ **Testar** (2 minutos)

```bash
curl -X POST https://seusite.com.br/wp-json/ts-ml/v1/updates \
  -d "action=version_check&version=1.0.0&plugin=ts-ml-integration"
```

**Deve retornar JSON com informações de atualização.**

---

## 🔍 Onde Está Cada Coisa

### No Seu Servidor (API):
```
seusite.com.br/
├── wp-content/plugins/ts-ml-update-api/  ← API aqui
└── downloads/                            ← ZIPs aqui
    └── ts-ml-integration-1.1.0.zip
```

### No Cliente (Plugin):
```
cliente.com.br/
└── wp-content/plugins/ts-ml-integration/  ← Plugin aqui
```

---

## 🔄 Como Funciona

1. **Cliente instala plugin** (versão 1.0.0)
2. **WordPress verifica atualizações** automaticamente
3. **Faz requisição** para: `https://seusite.com.br/wp-json/ts-ml/v1/updates`
4. **Sua API responde:** "versão 1.1.0 disponível"
5. **WordPress mostra notificação**
6. **Cliente clica "Atualizar"**
7. **WordPress baixa** de: `https://seusite.com.br/downloads/ts-ml-integration-1.1.0.zip`
8. **WordPress instala** automaticamente

---

## 📝 O Que Você Precisa Configurar

### No Plugin (Cliente):
- ✅ Update URI: `https://seusite.com.br/updates/ts-ml-integration`

### Na API (Servidor):
- ✅ Versão mais recente: `$latest_version = '1.1.0';`
- ✅ URL de download: `$download_url = 'https://seusite.com.br/downloads/...';`

---

## 🚀 Próximos Passos

1. **Mude Update URI** no plugin
2. **Crie API** no servidor (use exemplo fornecido)
3. **Teste** com curl
4. **Instale plugin** no WordPress do cliente
5. **Verifique** se notificação aparece

---

## 📚 Documentação Completa

- **Leia Primeiro:** `LEIA-ME-PRIMEIRO.md`
- **Configuração Rápida:** `CONFIGURACAO_RAPIDA.md`
- **Exemplo Completo:** `EXEMPLO_CONFIGURACAO_COMPLETA.md`
- **Guia Detalhado:** `CONFIGURAR_API_SERVIDOR.md`

---

**Última atualização:** Janeiro 2026
