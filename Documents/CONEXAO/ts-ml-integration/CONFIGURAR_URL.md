# 🔧 Como Configurar a URL da API de Atualizações

## 🎯 Onde Mudar a URL

A URL está configurada em **3 lugares**. Você precisa atualizar conforme seu servidor:

---

## 📍 Locais para Configurar

### 1️⃣ **No Cabeçalho do Plugin** (Principal)

**Arquivo:** `ts-ml-integration.php`

```php
/**
 * Update URI: https://SEU-SERVIDOR.com.br/updates/ts-ml-integration
 */
```

**O plugin converte automaticamente para:**
```
https://SEU-SERVIDOR.com.br/wp-json/ts-ml/v1/updates
```

### 2️⃣ **Via Constante** (Alternativa)

Adicione no `wp-config.php` do **cliente**:

```php
// wp-config.php
define('TS_ML_UPDATE_API_URL', 'https://SEU-SERVIDOR.com.br/wp-json/ts-ml/v1/updates');
```

### 3️⃣ **Via Configurações do Plugin** (Futuro)

Nas configurações do plugin (TS ML > Configurações), adicione campo para URL da API.

---

## 🔄 Como Funciona a Prioridade

O plugin verifica nesta ordem:

1. **Constante `TS_ML_UPDATE_API_URL`** (se definida)
2. **Opção `ts_ml_settings['update_api_url']`** (se configurada)
3. **Update URI do header** (converte automaticamente)
4. **Fallback padrão** (você deve mudar!)

---

## ⚙️ Configuração Rápida

### Passo 1: Mudar Update URI

**Arquivo:** `ts-ml-integration.php` (linha 15)

```php
/**
 * Update URI: https://seusite.com.br/updates/ts-ml-integration
 */
```

**Mude para:**
```php
/**
 * Update URI: https://SEU-SERVIDOR.com.br/updates/ts-ml-integration
 */
```

### Passo 2: Criar API no Servidor

Veja `CONFIGURAR_API_SERVIDOR.md` para instruções completas.

### Passo 3: Testar

```bash
curl -X POST https://SEU-SERVIDOR.com.br/wp-json/ts-ml/v1/updates \
  -d "action=version_check&version=1.0.0"
```

---

## 📝 Exemplo Prático

### Se seu servidor é `api.meusite.com.br`:

1. **Mudar Update URI:**
   ```php
   Update URI: https://api.meusite.com.br/updates/ts-ml-integration
   ```

2. **API estará em:**
   ```
   https://api.meusite.com.br/wp-json/ts-ml/v1/updates
   ```

3. **ZIPs em:**
   ```
   https://api.meusite.com.br/downloads/ts-ml-integration-1.1.0.zip
   ```

---

## 🔍 Verificar Configuração

### No código do plugin:

```php
// Ver qual URL está sendo usada
$updater = new TS_ML_Auto_Updater(TS_ML_PLUGIN_BASENAME);
// A URL está em $updater->api_url (privada, mas você pode adicionar método público)
```

### Via debug:

Adicione temporariamente em `class-ts-ml-auto-updater.php`:

```php
public function get_api_url() {
    return $this->api_url;
}
```

E use:
```php
$updater = new TS_ML_Auto_Updater(TS_ML_PLUGIN_BASENAME);
echo "API URL: " . $updater->get_api_url();
```

---

## ✅ Checklist

- [ ] **Update URI** atualizado no cabeçalho do plugin
- [ ] **API criada** no servidor
- [ ] **URL testada** manualmente
- [ ] **Plugin testado** no WordPress do cliente
- [ ] **Notificação de atualização** funciona

---

**Última atualização:** Janeiro 2026
