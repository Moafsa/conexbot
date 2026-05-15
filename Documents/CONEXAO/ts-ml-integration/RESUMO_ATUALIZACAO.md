# 📋 Resumo Rápido: Como Atualizar o Plugin

## 🎯 Resposta Direta

> **"Se no git tiver uma nova versão ele irá reconhecer automaticamente?"**

### ❌ NÃO reconhece automaticamente (sem fazer nada):
- WordPress não monitora Git sozinho
- Você precisa fazer `git pull` manualmente

### ✅ SIM reconhece automaticamente (após git pull):
- Depois que você faz `git pull` e atualiza os arquivos
- O sistema detecta a nova versão automaticamente
- Migrações executam automaticamente
- Não precisa fazer nada manualmente além do pull

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. PRIMEIRA INSTALAÇÃO (via ZIP)                        │
├─────────────────────────────────────────────────────────┤
│ • Upload do ZIP via WordPress Admin                     │
│ • Plugin instalado na versão 1.0.0                      │
│ • Versão salva no banco: ts_ml_version = "1.0.0"       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CONFIGURAR GIT (uma vez só)                          │
├─────────────────────────────────────────────────────────┤
│ • ssh usuario@servidor.com                              │
│ • cd wp-content/plugins/ts-ml-integration             │
│ • git init                                              │
│ • git remote add origin <url>                           │
│ • git add . && git commit -m "Versão 1.0.0"           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. QUANDO TIVER NOVA VERSÃO NO GIT                      │
├─────────────────────────────────────────────────────────┤
│ • git pull origin main                                  │
│   ↓                                                     │
│ • Arquivos atualizados                                  │
│   ↓                                                     │
│ • WordPress recarrega plugin                            │
│   ↓                                                     │
│ • TS_ML_Updater::check_version() executa               │
│   ↓                                                     │
│ • Detecta: banco = "1.0.0", código = "1.1.0"           │
│   ↓                                                     │
│ • Executa migrações automaticamente                     │
│   ↓                                                     │
│ • Atualiza banco: ts_ml_version = "1.1.0"              │
│   ↓                                                     │
│ • ✅ Plugin atualizado!                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Passo a Passo Prático

### Passo 1: Instalar via ZIP (Agora)
```
WordPress Admin > Plugins > Adicionar Novo > Enviar Plugin
→ Seleciona ts-ml-integration-1.0.0.zip
→ Instala
```

### Passo 2: Configurar Git (Depois)
```bash
# Execute o script de configuração
cd scripts
./configurar-git-plugin.sh usuario servidor.com https://github.com/usuario/ts-ml-integration.git

# OU manualmente:
ssh usuario@servidor.com
cd /var/www/html/wp-content/plugins/ts-ml-integration
git init
git remote add origin https://github.com/usuario/ts-ml-integration.git
git add .
git commit -m "Versão 1.0.0 instalada via ZIP"
```

### Passo 3: Quando Atualizar (Futuro)
```bash
# Opção 1: Script automático
cd scripts
./atualizar-plugin-git.sh 1.1.0 usuario servidor.com

# Opção 2: Manual
ssh usuario@servidor.com
cd /var/www/html/wp-content/plugins/ts-ml-integration
git pull origin main
# Pronto! Sistema detecta e atualiza automaticamente
```

---

## 🔍 Como o Sistema Detecta

### Quando o Plugin Carrega:
```php
// ts-ml-integration.php
add_action('plugins_loaded', 'ts_ml_integration_init', 20);

function ts_ml_integration_init() {
    // ...
    
    // Verifica versão automaticamente
    TS_ML_Updater::check_version();
}
```

### O que acontece:
```php
// class-ts-ml-updater.php
public static function check_version() {
    $installed = get_option('ts_ml_version', '0.0.0');  // Do banco
    $current = TS_ML_VERSION;  // Do código (arquivo)
    
    if ($installed < $current) {
        // NOVA VERSÃO DETECTADA!
        self::upgrade($installed, $current);
        // ↑ Executa migrações automaticamente
    }
}
```

---

## ✅ Comparação: ZIP vs Git

| Aspecto | Via ZIP | Via Git |
|---------|---------|---------|
| **Primeira instalação** | ✅ Upload ZIP | ❌ Não recomendado |
| **Atualização** | Upload novo ZIP | `git pull` |
| **Detecção automática** | ✅ Sim | ✅ Sim (após pull) |
| **Migrações automáticas** | ✅ Sim | ✅ Sim |
| **Velocidade** | Mais lento | Mais rápido |
| **Controle de versão** | ❌ Não | ✅ Sim |
| **Histórico** | ❌ Não | ✅ Sim |

**Conclusão:** Use ZIP na primeira vez, depois use Git para atualizações!

---

## 🚀 Exemplo Real

### Cenário: Atualizar de 1.0.0 para 1.1.0

#### 1. No Git (repositório):
```bash
# Versão atualizada no código
# ts-ml-integration.php: Version: 1.1.0
git commit -m "Versão 1.1.0"
git push origin main
```

#### 2. No Servidor:
```bash
ssh usuario@servidor.com
cd /var/www/html/wp-content/plugins/ts-ml-integration

# Versão atual no banco
wp option get ts_ml_version
# → 1.0.0

# Atualizar arquivos
git pull origin main

# WordPress recarrega automaticamente
# Sistema detecta: banco (1.0.0) < código (1.1.0)
# Executa migrações automaticamente

# Verificar versão atualizada
wp option get ts_ml_version
# → 1.1.0 ✅
```

---

## 💡 Dicas Importantes

1. **Primeira vez:** Use ZIP (mais simples)
2. **Depois:** Configure Git uma vez
3. **Atualizações:** Use `git pull` (mais rápido)
4. **Sistema detecta automaticamente** após atualizar arquivos
5. **Migrações executam automaticamente**
6. **Não precisa fazer nada manualmente** além do pull

---

## 🔗 Arquivos Relacionados

- **Guia Completo Git:** `ATUALIZACAO_GIT.md`
- **Guia Geral:** `COMO_ATUALIZAR.md`
- **Scripts:** 
  - `scripts/configurar-git-plugin.sh` (configurar Git)
  - `scripts/atualizar-plugin-git.sh` (atualizar via Git)

---

**Última atualização:** Janeiro 2026
