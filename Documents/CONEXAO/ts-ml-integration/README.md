# ToySport Mercado Livre Integration

Plugin completo para integração entre WooCommerce e Mercado Livre.

## 📋 Requisitos

- WordPress 6.8+
- WooCommerce 10.0+
- PHP 8.2+
- MySQL 8.x+

## 🚀 Instalação

1. Faça upload da pasta `ts-ml-integration` para `/wp-content/plugins/`
2. Ative o plugin através do menu 'Plugins' no WordPress
3. Configure suas contas do Mercado Livre em 'Mercado Livre > Configurações'
4. Conecte suas contas usando OAuth
5. Comece a sincronizar produtos!

## 📦 Funcionalidades

### ✅ Implementadas

- Estrutura base do plugin
- Sistema de autenticação OAuth
- Estrutura de banco de dados
- Interface administrativa básica
- Sistema de sincronização (estrutura)
- API Handler para Mercado Livre

### 🚧 Em Desenvolvimento

- Sincronização completa de produtos
- Sincronização de estoque e preços
- Gestão de pedidos
- Sistema de mensagens
- Integração com ChatGPT
- Gestão de envios
- Relatórios e analytics

## 📁 Estrutura do Plugin

```
ts-ml-integration/
├── admin/
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── views/
│   └── class-ts-ml-admin.php
├── includes/
│   ├── class-ts-ml-install.php
│   ├── class-ts-ml-api-handler.php
│   ├── class-ts-ml-sync-manager.php
│   ├── class-ts-ml-product-sync.php
│   ├── class-ts-ml-order-sync.php
│   ├── class-ts-ml-message-handler.php
│   ├── class-ts-ml-shipping-manager.php
│   ├── class-ts-ml-ai-integration.php
│   ├── class-ts-ml-catalog-manager.php
│   └── class-ts-ml-reports.php
├── public/
│   └── class-ts-ml-public.php
├── ts-ml-integration.php
└── readme.txt
```

## 🔧 Configuração

### 1. Credenciais do Mercado Livre

Para usar o plugin, você precisa:

1. Criar uma aplicação no [Mercado Livre Developers](https://developers.mercadolivre.com.br/)
2. Obter App ID e Secret Key
3. Configurar no plugin em 'Mercado Livre > Configurações'

### 2. Conectar Contas

1. Adicione uma nova conta no painel
2. Clique em "Conectar Conta"
3. Autorize o acesso no Mercado Livre
4. A conta será conectada automaticamente

## 📊 Banco de Dados

O plugin cria as seguintes tabelas:

- `wp_ts_ml_settings` - Configurações
- `wp_ts_ml_accounts` - Contas do Mercado Livre
- `wp_ts_ml_products` - Produtos sincronizados
- `wp_ts_ml_orders` - Pedidos sincronizados
- `wp_ts_ml_messages` - Mensagens
- `wp_ts_ml_sync_logs` - Logs de sincronização
- `wp_ts_ml_schedules` - Agendamentos

## 🔄 Sincronização

O plugin oferece sincronização automática via cron jobs:

- **Produtos**: A cada hora
- **Pedidos**: A cada hora
- **Estoque**: A cada hora
- **Preços**: A cada hora
- **Mensagens**: A cada hora
- **Envios**: A cada hora

## 🛠️ Desenvolvimento

### Estrutura de Classes

- `TS_ML_Integration` - Classe principal
- `TS_ML_API_Handler` - Handler da API do Mercado Livre
- `TS_ML_Sync_Manager` - Gerenciador de sincronizações
- `TS_ML_Product_Sync` - Sincronização de produtos
- `TS_ML_Order_Sync` - Sincronização de pedidos
- `TS_ML_Message_Handler` - Gerenciador de mensagens
- `TS_ML_Shipping_Manager` - Gerenciador de envios
- `TS_ML_AI_Integration` - Integração com ChatGPT
- `TS_ML_Catalog_Manager` - Gerenciador de catálogo
- `TS_ML_Reports` - Relatórios

## 📝 Changelog

### 1.0.0
- Versão inicial
- Estrutura base do plugin
- Autenticação OAuth
- Estrutura de banco de dados
- Interface administrativa básica

## 📄 Licença

GPL v2 or later

## 👥 Desenvolvido por

CONEXT
