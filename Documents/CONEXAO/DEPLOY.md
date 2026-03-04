# 🚀 Guia de Implantação - Conexbot

Este documento contém as instruções necessárias para instalar e rodar o Conexbot em ambientes de produção (Docker Swarm, Portainer ou VPS).

## 🛠 Pré-requisitos

1. **Docker & Docker Compose**
2. **Banco de Dados PostgreSQL**: Você pode usar o serviço incluído no `docker-compose.yml` ou um banco externo.
3. **Instância WuzAPI**: Necessária para a integração com o WhatsApp.
4. **FFmpeg**: O sistema converte áudios para OGG/Opus. 
   - **Nota**: A biblioteca `ffmpeg-static` tenta baixar o binário automaticamente. Em containers **Alpine Linux**, pode ser necessário instalar manualmente: `apk add ffmpeg`.

## 📦 Variáveis de Ambiente (.env)

Configure as seguintes variáveis no seu servidor:

```env
# URL base do Conexbot (Ex: https://meu-conexbot.com)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# URL que o WuzAPI (Docker) usará para enviar Webhooks de volta para este Next.js
# Se estiver no mesmo stack Docker, use o nome do serviço ou host.docker.internal
INTERNAL_WEBHOOK_URL=http://conexbot-app:3000

# Conexão Banco de Dados
DATABASE_URL="postgresql://user:pass@host:port/db?schema=public"

# Integração WhatsApp (WuzAPI)
UZAPI_URL=http://wuzapi:21465
WUZAPI_ADMIN_TOKEN=seu_token_admin

# Provedores de IA (Pelo menos um é obrigatório)
GEMINI_API_KEY=...
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...

# Outros
NEXTAUTH_SECRET=uma_chave_aleatoria_longa
NEXTAUTH_URL=https://seu-dominio.com
```

## 🚀 Passos para Instalação

### 1. Banco de Dados e Migrations
Antes de rodar o app, garanta que o banco está atualizado:
```bash
npx prisma migrate deploy
```

### 2. Build da Imagem Docker
```bash
docker build -t conexbot-app:latest .
```

### 3. Deploy (Docker Swarm / Portainer)
Certifique-se de que o Conexbot consegue alcançar o WuzAPI e vice-versa.
- O Conexbot envia comandos para `${UZAPI_URL}/session/connect`.
- O WuzAPI envia mensagens recebidas para `${INTERNAL_WEBHOOK_URL}/api/webhooks/whatsapp`.

## 🎤 Solução de Problemas: Áudio

Se o texto funciona mas o áudio não responde:
1. **Verifique o FFmpeg**: Execute `docker exec -it <container_id> ffmpeg -version`. Se não funcionar, o container não conseguirá converter os áudios TTS.
2. **Caminho de Mídia**: O bot salva áudios temporários em `public/media/temp`. Certifique-se de que essa pasta tem permissão de escrita.
3. **Payload WuzAPI**: O sistema agora usa `Audio` (Base64) em vez de `Url` para garantir que o WhatsApp aceite a mídia sem precisar baixar de um link externo.

## 🤖 Instruções para Agentes (Pair Programming)
- Ao ler o status da conexão, o sistema é **Case-Insensitive** (aceita `LoggedIn` ou `loggedIn`).
- O sistema possui **Fallback Automático**: se o Gemini estourar a cota (429), ele tentará OpenAI ou OpenRouter sozinho.
- **Webhook Universal**: O sistema detecta a porta dinamicamente, mas em produção o `INTERNAL_WEBHOOK_URL` tem prioridade.
