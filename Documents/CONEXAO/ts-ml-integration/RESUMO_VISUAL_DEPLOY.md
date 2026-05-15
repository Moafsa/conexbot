# 📊 Resumo Visual: Como Enviar para Servidor

## 🎯 Fluxo Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. PREPARAÇÃO LOCAL                                     │
├─────────────────────────────────────────────────────────┤
│ • Estrutura criada: ts-ml-api-server/                  │
│ • Dockerfile pronto                                     │
│ • API configurada (versão e URLs)                       │
│ • Git inicializado                                      │
└─────────────────────────────────────────────────────────┘
                        ↓ git push
┌─────────────────────────────────────────────────────────┐
│ 2. GITHUB                                               │
├─────────────────────────────────────────────────────────┤
│ • Repositório: github.com/seu-usuario/ts-ml-api-server  │
│ • Código da API                                         │
│ • Dockerfile                                            │
└─────────────────────────────────────────────────────────┘
                        ↓ webhook
┌─────────────────────────────────────────────────────────┐
│ 3. COOLIFY (Servidor)                                   │
├─────────────────────────────────────────────────────────┤
│ • Detecta push no Git                                   │
│ • Faz build do Docker                                    │
│ • Deploy automático                                     │
│ • SSL configurado (Let's Encrypt)                       │
│ • API rodando em: api.seusite.com.br                   │
└─────────────────────────────────────────────────────────┘
                        ↓ upload ZIPs
┌─────────────────────────────────────────────────────────┐
│ 4. DOWNLOADS                                            │
├─────────────────────────────────────────────────────────┤
│ • Pasta: /var/www/html/downloads/                      │
│ • ZIPs: ts-ml-integration-X.X.X.zip                    │
│ • Acessível via: api.seusite.com.br/downloads/...      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. CLIENTE (WordPress)                                  │
├─────────────────────────────────────────────────────────┤
│ • Plugin instalado                                      │
│ • Update URI: api.seusite.com.br/api/update-api.php    │
│ • WordPress verifica atualizações                       │
│ • Faz requisição à API                                  │
│ • Recebe: "versão 1.1.0 disponível"                    │
│ • Mostra notificação                                    │
│ • Cliente clica "Atualizar"                             │
│ • WordPress baixa e instala automaticamente             │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Onde Está Cada Coisa

### No Seu Computador:

```
ToySport/
├── wordpress/wp-content/plugins/ts-ml-integration/  ← Plugin (clientes)
│   └── ts-ml-integration.php                       ← Configurar Update URI aqui
│
└── ts-ml-api-server/                                ← API (servidor)
    ├── Dockerfile                                   ← Pronto para Coolify
    ├── api/
    │   └── update-api.php                          ← Configurar versão aqui
    └── downloads/                                   ← ZIPs via upload
```

### No Servidor (Coolify):

```
api.seusite.com.br/
├── /var/www/html/api/
│   └── update-api.php                              ← API rodando
└── /var/www/html/downloads/
    ├── ts-ml-integration-1.0.0.zip
    └── ts-ml-integration-1.1.0.zip                 ← ZIPs aqui
```

---

## 🔄 Processo de Atualização

### Quando Você Lança Nova Versão:

```
1. Desenvolver versão 1.2.0
   ↓
2. Editar API: TS_ML_LATEST_VERSION = '1.2.0'
   ↓
3. git commit && git push
   ↓
4. Coolify faz deploy automático
   ↓
5. Upload ZIP: scp ...zip .../downloads/
   ↓
6. Clientes recebem notificação automaticamente!
```

---

## ✅ Checklist Rápido

- [ ] **Estrutura criada** (`ts-ml-api-server/`)
- [ ] **API configurada** (versão e URLs)
- [ ] **Git conectado** (GitHub)
- [ ] **Coolify configurado** (projeto Docker)
- [ ] **Deploy realizado**
- [ ] **ZIPs uploadados**
- [ ] **Update URI configurado** no plugin
- [ ] **Testado** ✅

---

## 🚀 Comandos Rápidos

### Criar e Deploy:

```bash
# 1. Preparar
cd ts-ml-api-server
git init && git add . && git commit -m "API inicial"
git remote add origin https://github.com/seu-usuario/ts-ml-api-server.git
git push -u origin main

# 2. No Coolify: Criar projeto Docker (via UI)

# 3. Upload ZIP
./scripts/upload-zip-api.sh 1.0.0 usuario api.seusite.com.br
```

### Atualizar Versão:

```bash
# 1. Editar API
nano ts-ml-api-server/api/update-api.php  # Mudar versão

# 2. Commit e push
cd ts-ml-api-server
git commit -am "Versão 1.1.0" && git push

# 3. Upload ZIP
./scripts/upload-zip-api.sh 1.1.0 usuario api.seusite.com.br
```

---

## 💡 Dicas

1. **Use Coolify** - Muito mais fácil que servidor tradicional
2. **Separe repositórios** - Plugin e API separados
3. **Automatize** - Webhook faz deploy automático
4. **Use scripts** - Facilita upload de ZIPs
5. **Teste sempre** - Verifique API antes de distribuir plugin

---

**Última atualização:** Janeiro 2026
