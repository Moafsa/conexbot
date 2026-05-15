# ⚠️ IMPORTANTE: Configure a URL da API Antes de Usar!

## 🎯 O Que Você Precisa Fazer AGORA

### 1. **Mudar Update URI no Plugin**

**Arquivo:** `ts-ml-integration.php` (linha 15)

**Mude de:**
```php
Update URI: https://toysport.com.br/updates/ts-ml-integration
```

**Para:**
```php
Update URI: https://SEU-SERVIDOR.com.br/updates/ts-ml-integration
```

**Substitua `SEU-SERVIDOR.com.br` pelo domínio do seu servidor!**

---

### 2. **Criar API no Seu Servidor**

Você tem 2 opções:

#### **Opção A: WordPress REST API** (Recomendado)

1. Crie plugin simples no servidor (veja `CONFIGURAR_API_SERVIDOR.md`)
2. Endpoint: `https://seusite.com.br/wp-json/ts-ml/v1/updates`

#### **Opção B: Arquivo PHP Standalone**

1. Use arquivo `api/update-api-standalone.php`
2. Coloque em: `https://seusite.com.br/api/update-api.php`
3. Configure variáveis no topo do arquivo

---

## 📋 Por Que Está "toysport.com.br"?

Essa é uma **URL de exemplo**. Você **DEVE** mudar para o seu servidor!

O plugin precisa saber **onde** está sua API para verificar atualizações.

---

## 🔧 Configuração Rápida

### Passo 1: Editar Plugin

```php
// ts-ml-integration.php - linha 15
Update URI: https://SEU-SERVIDOR.com.br/updates/ts-ml-integration
```

### Passo 2: Criar API

Veja `CONFIGURAR_API_SERVIDOR.md` para instruções completas.

### Passo 3: Testar

```bash
curl -X POST https://SEU-SERVIDOR.com.br/wp-json/ts-ml/v1/updates \
  -d "action=version_check&version=1.0.0"
```

---

## 📚 Documentação

- **Configuração Rápida:** `CONFIGURACAO_RAPIDA.md`
- **Configurar API:** `CONFIGURAR_API_SERVIDOR.md`
- **Configurar URL:** `CONFIGURAR_URL.md`
- **Sistema Completo:** `SISTEMA_ATUALIZACAO_AUTOMATICA.md`

---

## ⚠️ Atenção

**Sem configurar a API, o sistema de atualizações automáticas NÃO funcionará!**

O plugin continuará funcionando normalmente, mas não detectará atualizações automaticamente.

---

**Última atualização:** Janeiro 2026
