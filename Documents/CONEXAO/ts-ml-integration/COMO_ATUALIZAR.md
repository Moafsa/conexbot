# 🔄 Como Atualizar o Plugin TS-ML Integration

## 📋 Métodos de Atualização

### 1️⃣ **Atualização Automática (Recomendado)**

O plugin agora possui sistema de atualização automática integrado. Quando você atualizar o arquivo do plugin, o sistema detectará automaticamente a nova versão e executará as migrações necessárias.

**Como funciona:**
1. O plugin verifica a versão instalada vs versão atual
2. Se detectar diferença, executa migrações automáticas
3. Atualiza a versão no banco de dados
4. Registra log da atualização

**Não é necessário fazer nada manualmente!** O sistema cuida de tudo automaticamente.

---

### 2️⃣ **Atualização Manual via ZIP**

#### Passo a Passo:

1. **Criar ZIP da nova versão:**
   ```bash
   # No diretório do projeto
   cd scripts
   ./criar-zip-plugin.sh ts-ml-integration 1.1.0
   ```

2. **Fazer backup no servidor:**
   ```bash
   # Via SSH
   ssh usuario@servidor.com
   cd /var/www/html/wp-content/plugins
   cp -r ts-ml-integration ts-ml-integration-backup
   ```

3. **Upload do ZIP:**
   - WordPress Admin > Plugins > Adicionar Novo > Enviar Plugin
   - Selecione o arquivo `ts-ml-integration-1.1.0.zip`
   - WordPress detectará que o plugin existe e perguntará se deseja substituir
   - Clique em **"Substituir atual"**

4. **OU via WP-CLI:**
   ```bash
   wp plugin install ts-ml-integration-1.1.0.zip --force --activate
   ```

---

### 3️⃣ **Atualização via Git (Melhor para Desenvolvimento)**

#### Configuração Inicial:

1. No servidor, inicialize Git no plugin:
   ```bash
   cd /var/www/html/wp-content/plugins/ts-ml-integration
   git init
   git remote add origin https://github.com/seu-usuario/ts-ml-integration.git
   ```

2. **Atualizar plugin:**
   ```bash
   # Via script
   cd scripts
   ./atualizar-plugin.sh ts-ml-integration 1.1.0 usuario servidor.com
   
   # Ou manualmente
   ssh usuario@servidor.com
   cd /var/www/html/wp-content/plugins/ts-ml-integration
   git pull origin main
   wp plugin deactivate ts-ml-integration
   wp plugin activate ts-ml-integration
   ```

---

## 🔧 Sistema de Versionamento

### Versão Atual: 1.0.0

O plugin usa **Semantic Versioning** (MAJOR.MINOR.PATCH):
- **MAJOR** (1.0.0): Mudanças incompatíveis
- **MINOR** (0.1.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.1): Correções de bugs compatíveis

### Onde Atualizar a Versão:

1. **Arquivo principal:** `ts-ml-integration.php`
   ```php
   /**
    * Version: 1.1.0  ← ATUALIZE AQUI
    */
   define('TS_ML_VERSION', '1.1.0');  ← E AQUI TAMBÉM
   ```

2. **readme.txt** (para WordPress.org):
   ```
   Stable tag: 1.1.0
   ```

3. **CHANGELOG.md:**
   ```markdown
   ## [1.1.0] - 2026-01-20
   ### Added
   - Nova funcionalidade X
   ```

---

## ✅ Checklist de Atualização

### Antes de Atualizar:

- [ ] **Backup completo** (banco de dados + arquivos)
- [ ] **Teste em ambiente de desenvolvimento/staging**
- [ ] **Verifique compatibilidade** com WordPress e WooCommerce
- [ ] **Documente mudanças** no CHANGELOG.md
- [ ] **Atualize número da versão** em todos os lugares
- [ ] **Teste migrações** em ambiente de desenvolvimento

### Durante a Atualização:

- [ ] **Desative plugin** temporariamente (se necessário)
- [ ] **Faça backup** da versão antiga
- [ ] **Substitua arquivos** ou instale nova versão
- [ ] **Verifique permissões** (644 para arquivos, 755 para pastas)
- [ ] **Reative o plugin**

### Após a Atualização:

- [ ] **Verifique se dados foram preservados**
- [ ] **Teste funcionalidades principais**
- [ ] **Verifique logs de atualização** (wp-admin > TS ML > Relatórios)
- [ ] **Limpe cache** (WordPress, navegador, CDN)
- [ ] **Monitore por alguns dias**

---

## 🔍 Verificar Versão Instalada

### Via WordPress Admin:

1. Vá em **Plugins > Plugins Instalados**
2. Procure por "ToySport Mercado Livre Integration"
3. A versão está exibida abaixo do nome

### Via Código:

```php
// Obter versão instalada
$installed_version = get_option('ts_ml_version', '0.0.0');
echo "Versão instalada: " . $installed_version;

// Obter versão atual do código
echo "Versão atual: " . TS_ML_VERSION;
```

### Via WP-CLI:

```bash
wp option get ts_ml_version
```

---

## 📊 Logs de Atualização

O plugin registra todas as atualizações automaticamente. Para ver os logs:

1. **Via WordPress Admin:**
   - Vá em **TS ML > Relatórios**
   - Procure por "Logs de Atualização"

2. **Via Código:**
   ```php
   $upgrade_log = TS_ML_Updater::get_upgrade_log();
   print_r($upgrade_log);
   ```

3. **Via Banco de Dados:**
   ```sql
   SELECT * FROM wp_options WHERE option_name = 'ts_ml_upgrade_log';
   ```

---

## 🚨 Problemas Comuns e Soluções

### Erro: "Plugin não pode ser atualizado"

**Solução:**
- Verifique permissões de arquivos (644/755)
- Verifique se pasta do plugin não está protegida
- Tente desativar e reativar o plugin
- Verifique logs do WordPress em `wp-content/debug.log`

### Dados perdidos após atualização

**Solução:**
- O sistema de migração automática preserva dados
- Sempre faça backup antes de atualizar
- Verifique logs de atualização para ver o que foi migrado
- Se necessário, restaure o backup

### Plugin quebrado após atualização

**Solução:**
- Restaure backup imediatamente
- Verifique logs de erro do WordPress
- Revise código de migração em `class-ts-ml-updater.php`
- Teste em ambiente de desenvolvimento primeiro

### Versão não atualiza

**Solução:**
- Limpe cache de atualizações: `delete_transient('update_plugins')`
- Verifique se `Update URI` está correto no cabeçalho
- Verifique se a versão foi atualizada em todos os lugares
- Force verificação: `TS_ML_Updater::check_version()`

### Migrações não executam

**Solução:**
- Verifique se a classe `TS_ML_Updater` está sendo carregada
- Verifique logs do plugin em `wp-content/uploads/ts-ml-logs/`
- Execute manualmente: `TS_ML_Updater::check_version()`
- Verifique se há erros PHP no debug.log

---

## 🔄 Migrações Automáticas

O plugin executa migrações automaticamente quando detecta atualização de versão. As migrações estão em `includes/class-ts-ml-updater.php`.

### Migrações Disponíveis:

- **1.0.0 → 1.1.0:** Adiciona suporte a variações de produtos
- **1.1.0 → 1.2.0:** Adiciona tabela de etiquetas de envio
- **1.2.0 → 1.3.0:** Atualiza configurações de IA

### Adicionar Nova Migração:

1. Edite `includes/class-ts-ml-updater.php`
2. Adicione método `migrate_to_X_X_X()`
3. Adicione chamada em `run_migrations()`:
   ```php
   if (version_compare($old_version, '1.4.0', '<')) {
       self::migrate_to_1_4_0();
   }
   ```

---

## 📚 Scripts de Ajuda

### Criar ZIP para Atualização:

```bash
# Linux/Mac
cd scripts
./criar-zip-plugin.sh ts-ml-integration 1.1.0

# Windows PowerShell
cd scripts
.\atualizar-plugin.ps1 -PluginName "ts-ml-integration" -Version "1.1.0" -Server "seusite.com"
```

### Atualizar via Git:

```bash
cd scripts
./atualizar-plugin.sh ts-ml-integration 1.1.0 usuario servidor.com
```

---

## 💡 Dicas Importantes

1. **Sempre teste primeiro** em ambiente de desenvolvimento
2. **Use versionamento semântico:** MAJOR.MINOR.PATCH
3. **Documente todas as mudanças** no CHANGELOG.md
4. **Mantenha backups** das últimas 3 versões
5. **Use Git** para controle de versão do código
6. **Implemente migrações** para preservar dados
7. **Monitore logs** após cada atualização
8. **Teste migrações** antes de fazer deploy

---

## 🔗 Links Úteis

- **Guia Completo:** `GUIA_VERSIONAMENTO_PLUGINS.md` (na raiz do projeto)
- **Exemplo Prático:** `EXEMPLO_PLUGIN_ATUALIZACAO.php` (na raiz do projeto)
- **CHANGELOG:** `CHANGELOG.md` (neste diretório)
- **WordPress Plugin Handbook:** https://developer.wordpress.org/plugins/plugin-basics/updating-a-plugin/

---

**Última atualização:** Janeiro 2026
