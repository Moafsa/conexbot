# 🔄 Como Funciona Atualização via Git - TS-ML Integration

## ⚠️ IMPORTANTE: Entendendo os Tipos de Atualização

### 1️⃣ **Atualização Automática do WordPress (Update URI)**
- WordPress detecta automaticamente novas versões
- Mostra notificação no painel admin
- Usuário clica em "Atualizar" e WordPress baixa/instala automaticamente
- **Requer:** API de atualizações configurada no servidor

### 2️⃣ **Atualização Manual via Git**
- Você faz `git pull` no servidor manualmente
- Substitui os arquivos do plugin
- O sistema de versionamento detecta a mudança e executa migrações
- **Não é automático pelo WordPress**, mas o sistema de migração funciona automaticamente

---

## 🔧 Como Funciona na Prática

### Cenário 1: Instalação via ZIP → Depois usar Git

#### Passo 1: Instalar via ZIP (Primeira vez)
```bash
# Você faz upload do ZIP via WordPress Admin
# Plugin é instalado na versão 1.0.0
```

#### Passo 2: Configurar Git no Servidor
```bash
# Conectar ao servidor
ssh usuario@servidor.com

# Navegar até o plugin
cd /var/www/html/wp-content/plugins/ts-ml-integration

# Inicializar Git (se ainda não estiver)
git init

# Adicionar repositório remoto
git remote add origin https://github.com/seu-usuario/ts-ml-integration.git

# Fazer primeiro commit dos arquivos atuais
git add .
git commit -m "Versão 1.0.0 instalada via ZIP"

# Conectar com repositório remoto
git branch -M main
git pull origin main --allow-unrelated-histories
```

#### Passo 3: Quando tiver nova versão no Git
```bash
# Conectar ao servidor
ssh usuario@servidor.com

# Navegar até o plugin
cd /var/www/html/wp-content/plugins/ts-ml-integration

# Fazer pull da nova versão
git pull origin main

# O sistema de atualização detecta automaticamente!
# O plugin verifica a versão e executa migrações se necessário
```

**O que acontece automaticamente:**
1. ✅ Arquivos são atualizados via `git pull`
2. ✅ WordPress carrega o plugin novamente
3. ✅ `TS_ML_Updater::check_version()` detecta nova versão
4. ✅ Migrações são executadas automaticamente
5. ✅ Versão é atualizada no banco de dados
6. ✅ Logs são registrados

---

## 🚀 Sistema de Detecção Automática

O sistema que implementamos funciona assim:

### Quando o Plugin Carrega:
```php
// Em ts-ml-integration.php
add_action('plugins_loaded', 'ts_ml_integration_init', 20);

function ts_ml_integration_init() {
    // ...
    
    // Verifica versão e atualiza se necessário
    if (class_exists('TS_ML_Updater')) {
        TS_ML_Updater::check_version();  // ← Detecta automaticamente!
    }
}
```

### O que `check_version()` faz:
```php
public static function check_version() {
    $installed_version = get_option('ts_ml_version', '0.0.0');  // Versão no banco
    $current_version = TS_ML_VERSION;  // Versão no código (definida no arquivo)
    
    if (version_compare($installed_version, $current_version, '<')) {
        // Nova versão detectada! Executa migrações
        self::upgrade($installed_version, $current_version);
    }
}
```

**Então:**
- ✅ Se você atualizar os arquivos via Git, o sistema detecta automaticamente
- ✅ Não precisa fazer nada manualmente além do `git pull`
- ✅ Migrações são executadas automaticamente

---

## 📋 Fluxo Completo de Atualização via Git

### 1. Desenvolvimento Local

```bash
# No seu computador
cd ts-ml-integration

# Fazer mudanças no código
# Atualizar versão em ts-ml-integration.php
# Version: 1.1.0
# define('TS_ML_VERSION', '1.1.0');

# Commit e push
git add .
git commit -m "Atualização para versão 1.1.0"
git push origin main
```

### 2. No Servidor (Produção)

```bash
# Conectar ao servidor
ssh usuario@servidor.com

# Navegar até o plugin
cd /var/www/html/wp-content/plugins/ts-ml-integration

# Fazer pull da nova versão
git pull origin main

# Pronto! O sistema detecta automaticamente e atualiza
```

### 3. Verificar Atualização

```bash
# Via WP-CLI
wp option get ts_ml_version

# Ou acesse WordPress Admin > Plugins
# A versão será atualizada automaticamente
```

---

## 🔄 Comparação: ZIP vs Git

### Via ZIP:
```
1. Criar ZIP da nova versão
2. Fazer upload via WordPress Admin
3. WordPress substitui arquivos
4. Sistema detecta nova versão → Executa migrações
5. ✅ Atualizado!
```

### Via Git:
```
1. Fazer git pull no servidor
2. Arquivos são atualizados
3. Sistema detecta nova versão → Executa migrações
4. ✅ Atualizado!
```

**Ambos funcionam da mesma forma!** A diferença é apenas como você atualiza os arquivos.

---

## ⚙️ Configuração Recomendada

### Opção 1: Git Manual (Simples)

```bash
# Script simples para atualizar
#!/bin/bash
cd /var/www/html/wp-content/plugins/ts-ml-integration
git pull origin main
```

Execute manualmente quando precisar atualizar.

### Opção 2: Git com Webhook (Automático)

Configure um webhook no GitHub/GitLab que executa o pull automaticamente:

```php
// Criar endpoint REST API no WordPress
add_action('rest_api_init', function() {
    register_rest_route('ts-ml/v1', '/webhook-update', array(
        'methods' => 'POST',
        'callback' => 'ts_ml_git_webhook_update',
        'permission_callback' => function() {
            // Verificar token de segurança
            return isset($_GET['token']) && $_GET['token'] === 'seu-token-secreto';
        }
    ));
});

function ts_ml_git_webhook_update() {
    $plugin_dir = WP_PLUGIN_DIR . '/ts-ml-integration';
    $output = shell_exec("cd $plugin_dir && git pull origin main 2>&1");
    return array('success' => true, 'output' => $output);
}
```

### Opção 3: Cron Job (Agendado)

```bash
# Adicionar ao crontab
# Verifica atualizações todo dia às 2h da manhã
0 2 * * * cd /var/www/html/wp-content/plugins/ts-ml-integration && git pull origin main >> /var/log/ts-ml-update.log 2>&1
```

---

## 🎯 Resposta Direta à Sua Pergunta

> "Se no git tiver uma nova versão ele irá reconhecer automaticamente?"

**Resposta:** Depende do que você quer dizer com "reconhecer automaticamente":

### ❌ NÃO reconhece automaticamente (sem configuração):
- WordPress não monitora Git automaticamente
- Você precisa fazer `git pull` manualmente ou via script

### ✅ SIM reconhece automaticamente (após git pull):
- Depois que você faz `git pull` e os arquivos são atualizados
- O sistema de versionamento detecta a nova versão automaticamente
- Migrações são executadas automaticamente
- Não precisa fazer nada manualmente além do pull

---

## 💡 Recomendação

### Para Desenvolvimento/Staging:
```bash
# Use Git diretamente
cd /var/www/html/wp-content/plugins/ts-ml-integration
git pull origin main
```

### Para Produção:
```bash
# Opção 1: Manual (mais seguro)
# Faça pull manualmente quando quiser atualizar

# Opção 2: Script automatizado
# Crie um script que você executa quando quiser atualizar
./atualizar-plugin.sh ts-ml-integration

# Opção 3: Webhook (cuidado com segurança!)
# Configure webhook do GitHub para atualizar automaticamente
```

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **Nunca exponha credenciais Git** no código
2. **Use SSH keys** para autenticação Git
3. **Proteja webhooks** com tokens secretos
4. **Faça backup** antes de atualizar em produção
5. **Teste em staging** primeiro

---

## 📚 Exemplo Prático Completo

### Cenário: Atualizar de 1.0.0 para 1.1.0

#### 1. No Desenvolvimento:
```bash
# Atualizar versão
# ts-ml-integration.php: Version: 1.1.0
# ts-ml-integration.php: define('TS_ML_VERSION', '1.1.0');

# Commit
git add .
git commit -m "Versão 1.1.0 - Adiciona suporte a variações"
git push origin main
```

#### 2. No Servidor:
```bash
ssh usuario@servidor.com
cd /var/www/html/wp-content/plugins/ts-ml-integration

# Ver versão atual instalada
wp option get ts_ml_version
# Retorna: 1.0.0

# Fazer pull
git pull origin main

# Verificar novamente
wp option get ts_ml_version
# Retorna: 1.1.0 (atualizado automaticamente!)

# Ver logs de atualização
wp option get ts_ml_upgrade_log
# Mostra log da atualização
```

---

## ✅ Resumo

1. **Instale via ZIP** na primeira vez (como você vai fazer)
2. **Configure Git** no servidor depois
3. **Quando tiver nova versão:** Faça `git pull`
4. **Sistema detecta automaticamente** a nova versão
5. **Migrações executam automaticamente**
6. **Pronto!** Plugin atualizado

**O WordPress não monitora Git sozinho, mas depois que você atualiza os arquivos (via Git ou ZIP), o sistema de versionamento funciona automaticamente!**

---

**Última atualização:** Janeiro 2026
