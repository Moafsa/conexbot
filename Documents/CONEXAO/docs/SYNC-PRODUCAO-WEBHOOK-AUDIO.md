# Sincronização Produção – Webhook e Áudio

Este documento lista **todas as alterações** feitas para corrigir o webhook do WhatsApp e o fluxo de áudio em produção (Docker). Use para manter o código local igual ao online e evitar perda de alterações em futuras atualizações.

---

## Resumo das alterações

1. **Webhook URL** – Remoção de portas fixas (3004), uso de variáveis de ambiente
2. **WuzAPI setWebhook** – Campo `webhookurl` (minúsculo) em vez de `webhook`
3. **Áudio sem file_url** – Fallback para `UzapiService.downloadAudio()` quando o WuzAPI não envia `file_url`
4. **Temp de áudio** – Arquivo temporário em `/tmp` (não em `process.cwd()`) para evitar EACCES no Docker
5. **Temp de TTS (resposta em áudio)** – Arquivos MP3/OGG do VoiceService em `/tmp` em vez de `public/media/temp` (EACCES no Docker)
6. **Variáveis de ambiente** – `INTERNAL_WEBHOOK_URL` para rede interna Docker

---

## Arquivos alterados

### 1. `src/app/api/whatsapp/connect/route.ts`

**Alteração:** Ordem de prioridade do `baseUrl` para o webhook.

**Trecho alterado (linhas 41-57):**

```typescript
        // Webhook URL: priorizar URL pública (Traefik) para WuzAPI alcançar o app
        let baseUrl =
            process.env.INTERNAL_WEBHOOK_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXTAUTH_URL;

        if (!baseUrl) {
            const hostHeader = req.headers.get('host') || 'localhost:3000';
            if (hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1')) {
                const port = hostHeader.split(':')[1] || '3000';
                baseUrl = `http://host.docker.internal:${port}`;
            } else {
                const protocol = req.headers.get('x-forwarded-proto') || 'https';
                baseUrl = `${protocol}://${hostHeader}`;
            }
        }
```

---

### 2. `src/services/engine/uzapi.ts`

**Alterações:**
- Método `downloadAudio()` adicionado
- `setWebhook()` usa `webhookurl` em vez de `webhook`

**Método `downloadAudio` (adicionar antes de `setWebhook`):**

```typescript
    /** Download audio via WuzAPI /chat/downloadaudio (when file_url not in webhook) */
    async downloadAudio(sessionName: string, audioMessage: {
        URL?: string; Url?: string;
        mimetype?: string; Mimetype?: string;
        fileSHA256?: string; FileSHA256?: string;
        fileLength?: number; FileLength?: number;
        mediaKey?: string; MediaKey?: string;
        fileEncSHA256?: string; FileEncSHA256?: string;
        directPath?: string; DirectPath?: string;
    }): Promise<Buffer | null> {
        try {
            // WuzAPI issue #66: + in URL can become space when decoded - restore for API
            let url = (audioMessage.URL || audioMessage.Url || '').replace(/ /g, '+');
            const mimetype = audioMessage.mimetype || audioMessage.Mimetype || 'audio/ogg; codecs=opus';
            const fileLength = audioMessage.fileLength ?? audioMessage.FileLength ?? 0;
            const directPath = audioMessage.directPath || audioMessage.DirectPath || '';

            if (!url) return null;

            const body: Record<string, unknown> = {
                Url: url,
                Mimetype: mimetype,
                FileLength: fileLength,
            };
            if (directPath) body.DirectPath = directPath;
            const sha = audioMessage.fileSHA256 || audioMessage.FileSHA256;
            const encSha = audioMessage.fileEncSHA256 || audioMessage.FileEncSHA256;
            const key = audioMessage.mediaKey || audioMessage.MediaKey;
            if (sha) body.FileSHA256 = sha;
            if (encSha) body.FileEncSHA256 = encSha;
            if (key) body.MediaKey = key;

            const res = await fetch(`${UZAPI_URL}/chat/downloadaudio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': sessionName,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('[UZAPI] downloadAudio failed:', res.status, errText.substring(0, 200));
                return null;
            }

            const data = await res.json();
            // WuzAPI returns { Mimetype, Data: "data:audio/ogg;base64,..." } or wrapped in data
            const raw = data?.data?.Data ?? data?.Data ?? data?.data?.Audio ?? data?.Audio;
            if (typeof raw === 'string') {
                const b64 = raw.includes(',') ? raw.split(',')[1] : raw;
                return Buffer.from(b64, 'base64');
            }
            return null;
        } catch (e: unknown) {
            console.error('[UZAPI] downloadAudio exception:', e);
            return null;
        }
    },
```

**Trecho do `setWebhook` (linhas 348-358):**

```typescript
                body: JSON.stringify({
                    webhookurl: webhookUrl,
                    events: ["Message", "ReadReceipt", "Disconnected", "Connected"]
                }),
```

---

### 3. `src/app/api/webhooks/whatsapp/route.ts`

**Alterações:**
- `logToFile`: adicionar `console.error` para mensagens de áudio (visível em `docker logs`)
- Temp de áudio em `/tmp` em vez de `process.cwd()`
- Fallback para `UzapiService.downloadAudio()` quando não há `file_url` nem `base64`

**Função `logToFile` (linhas 7-19):**

```typescript
function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'debug-today.log'), line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
    // stdout para docker logs (áudio/debug)
    if (msg.includes('Audio') || msg.includes('downloadAudio') || msg.includes('Transcription') || msg.includes('file_url')) {
        console.error(`[Webhook] ${msg}`);
    }
}
```

**Bloco de áudio completo (substituir o bloco `if (audioMessage)`):**

```typescript
            if (audioMessage) {
                logToFile(`Audio detected! file_url: ${(body as any).file_url || 'none'}, audioMessage: ${!!audioMessage}`);
                try {
                    const { VoiceService } = await import('@/services/engine/voice');
                    const { UzapiService } = await import('@/services/engine/uzapi');

                    const mediaUrl = (body as any).file_url || (audioMessage as any).url;
                    const base64Data = (body as any).base64 || (body as any).data || (audioMessage as any).base64;
                    logToFile(`Audio Candidates - file_url: ${(body as any).file_url}, hasBase64: ${!!base64Data}`);

                    const tempFile = path.join('/tmp', 'temp_audio_' + Date.now() + '.ogg');
                    let gotBuffer = false;

                    if (base64Data) {
                        logToFile(`Processing audio from base64 data...`);
                        const buffer = Buffer.from((base64Data.split(',').pop() || base64Data), 'base64');
                        fs.writeFileSync(tempFile, buffer);
                        gotBuffer = true;
                    } else if (mediaUrl) {
                        logToFile(`Downloading audio from file_url: ${mediaUrl}`);
                        let fetchUrl = mediaUrl;
                        if (fetchUrl.includes('localhost') || fetchUrl.includes('127.0.0.1')) {
                            const uzapiBase = process.env.UZAPI_URL || 'http://uzapi:8080';
                            const uzapiUrl = new URL(uzapiBase);
                            try {
                                const urlObj = new URL(fetchUrl);
                                urlObj.protocol = uzapiUrl.protocol;
                                urlObj.hostname = uzapiUrl.hostname;
                                urlObj.port = uzapiUrl.port || (uzapiUrl.protocol === 'https:' ? '443' : '80');
                                fetchUrl = urlObj.toString();
                            } catch {
                                fetchUrl = fetchUrl.replace(/localhost|127\.0\.0\.1/, 'uzapi').replace(':5555', ':8080');
                            }
                            logToFile(`Rewrote to: ${fetchUrl}`);
                        }
                        try {
                            const buffer = await fetch(fetchUrl).then(r => {
                                if (!r.ok) throw new Error(`Fetch failed: ${r.status} ${r.statusText}`);
                                return r.arrayBuffer();
                            });
                            fs.writeFileSync(tempFile, Buffer.from(buffer));
                            gotBuffer = true;
                        } catch (e: unknown) {
                            logToFile(`Fetch file_url failed: ${(e as Error).message}`);
                        }
                    }

                    // Fallback: WuzAPI não envia file_url (deleta antes do webhook). Usar /chat/downloadaudio.
                    if (!gotBuffer && ((audioMessage as any).URL || (audioMessage as any).Url)) {
                        logToFile(`No file_url - using UzapiService.downloadAudio session=${sessionName}`);
                        const buffer = await UzapiService.downloadAudio(sessionName, audioMessage as any);
                        logToFile(`downloadAudio result: ${buffer ? buffer.length + ' bytes' : 'null'}`);
                        if (buffer && buffer.length > 0) {
                            fs.writeFileSync(tempFile, buffer);
                            gotBuffer = true;
                        } else {
                            logToFile(`downloadAudio returned empty - check UZAPI_URL and token`);
                        }
                    }

                    if (gotBuffer && fs.existsSync(tempFile)) {
                        const transcription = await VoiceService.transcribe(
                            tempFile,
                            botDoc?.tenant?.openaiApiKey || undefined,
                            botDoc?.tenant?.geminiApiKey || undefined
                        );
                        logToFile(`Transcription: ${transcription}`);
                        fs.unlinkSync(tempFile);
                        if (transcription) {
                            const { BufferingService } = await import('@/services/engine/buffering');
                            BufferingService.add(sessionName, cleanPhone, transcription, 'whatsapp', 'audio').catch(err => {
                                logToFile(`BUFFER ERROR (Audio): ${err?.message || err}`);
                            });
                        }
                    } else {
                        logToFile('Audio content missing (no URL and no base64)');
                    }
                } catch (e: any) {
                    logToFile(`Transcription Error: ${e.message}`);
                }
            }
```

---

### 4. `src/services/engine/voice.ts`

**Problema:** O TTS (resposta em áudio via OpenAI ou ElevenLabs) falhava com `EACCES: permission denied` ao gravar o MP3 em `/app/public/media/temp/`. O container roda como usuário `nextjs` e não pode escrever nesse diretório.

**Alteração:** Salvar os arquivos TTS em `/tmp` em vez de `public/media/temp`.

**Trecho alterado (método `speak`, após gerar o buffer):**

```typescript
            // Save to /tmp (Docker-safe; public/media/temp can have EACCES)
            const fileName = `tts-${crypto.randomUUID()}.mp3`;
            const tempDir = '/tmp';

            const filePath = path.join(tempDir, fileName);
```

**Remover:** O bloco que criava `publicDir` e fazia `mkdirSync`:

```typescript
            // REMOVER isto:
            const publicDir = path.join(process.cwd(), 'public', 'media', 'temp');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }
            const filePath = path.join(publicDir, fileName);
```

**Após a alteração:** É necessário rebuild e restart do container para aplicar (`docker compose up -d --build app`).

---

### 6. `.agent/skills/wuzapi-connection/scripts/fix_webhooks.ts`

**Alterações:**
- `NEXT_APP_URL` via variáveis de ambiente
- Body do POST com `webhookurl`

**Trechos:**

```typescript
import * as dotenv from 'dotenv';
dotenv.config();

// CONFIGURATION
const UZAPI_URL = 'http://127.0.0.1:21465';
const ADMIN_TOKEN = process.env.WUZAPI_ADMIN_TOKEN || 'admin_token_123';
const NEXT_APP_URL =
    process.env.INTERNAL_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://host.docker.internal:3000';
```

```typescript
                body: JSON.stringify({
                    webhookurl: webhookUrl,
                    events: ["Message", "ReadReceipt", "Disconnected", "Connected"]
                }),
```

---

### 7. `scripts/sync-webhooks.ts`

**Alteração:** `baseUrl` a partir de variáveis de ambiente.

```typescript
    const baseUrl =
        process.env.INTERNAL_WEBHOOK_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'http://host.docker.internal:3000';
```

---

### 8. `scripts/sync-webhooks.js`

**Alteração:** Mesmo `baseUrl` e uso de `webhookurl`.

```javascript
    const baseUrl =
        process.env.INTERNAL_WEBHOOK_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'http://host.docker.internal:3000';
```

```javascript
                body: JSON.stringify({
                    webhookurl: webhookUrl,
                }),
```

---

### 9. `.env.example`

**Adicionar no final:**

```
# Webhook interno (só em Docker): WuzAPI chama app via rede interna. Ex: http://app:3000
# Em dev local (app no host), não definir — usa host.docker.internal automaticamente
# INTERNAL_WEBHOOK_URL="http://app:3000"
```

---

### 10. `docker-compose.production.yml`

**Garantir no serviço `app`:**

```yaml
      INTERNAL_WEBHOOK_URL: http://app:3000
```

---

### 11. `.env` (produção)

**Adicionar:**

```
INTERNAL_WEBHOOK_URL=http://app:3000
```

---

## Instruções para o agente local

Use o texto abaixo para instruir o agente a manter o código local alinhado com a produção:

---

> **Sincroniza o código local com produção (webhook + áudio + TTS):**
>
> 1. **connect/route.ts** – `baseUrl` na ordem: `INTERNAL_WEBHOOK_URL` → `NEXT_PUBLIC_APP_URL` → `NEXTAUTH_URL`. Sem hardcode de porta.
>
> 2. **uzapi.ts** – Método `downloadAudio()` que chama `/chat/downloadaudio`. Em `setWebhook`, usar `webhookurl` (minúsculo) no body.
>
> 3. **webhooks/whatsapp/route.ts** – Temp de áudio em `/tmp`. Fallback para `UzapiService.downloadAudio()` quando não houver `file_url` nem `base64`. Logs de áudio em `console.error` para `docker logs`.
>
> 4. **voice.ts** – TTS (resposta em áudio): salvar MP3/OGG em `/tmp` em vez de `public/media/temp`. O diretório `public/media/temp` causa EACCES no Docker (usuário `nextjs` não pode escrever). Substituir `publicDir` por `tempDir = '/tmp'` e `filePath = path.join(tempDir, fileName)`.
>
> 5. **fix_webhooks.ts** – `NEXT_APP_URL` via env. Body com `webhookurl`.
>
> 6. **sync-webhooks.ts e sync-webhooks.js** – `baseUrl` via `INTERNAL_WEBHOOK_URL` / `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL`.
>
> 7. **.env.example** – Incluir `INTERNAL_WEBHOOK_URL` com comentário.
>
> Após alterações: rebuild e restart do container (`docker compose up -d --build app`).
>
> Referência completa: `docs/SYNC-PRODUCAO-WEBHOOK-AUDIO.md`

---

## Comando para atualizar webhooks em produção

Dentro do container do app:

```bash
docker exec -e UZAPI_URL=http://uzapi:8080 -e INTERNAL_WEBHOOK_URL=http://app:3000 conext-app sh -c 'for s in bot-XXX bot-YYY; do wget -qO- --post-data="{\"webhookurl\":\"http://app:3000/api/webhooks/whatsapp\",\"events\":[\"Message\",\"ReadReceipt\",\"Disconnected\",\"Connected\"]}" --header="Content-Type: application/json" --header="Token: $s" http://uzapi:8080/webhook; echo; done'
```

Substitua `bot-XXX` e `bot-YYY` pelos `sessionName` dos bots (consulte o banco).

---

## Variáveis de ambiente

| Variável | Produção (Docker) | Desenvolvimento |
|----------|-------------------|-----------------|
| `INTERNAL_WEBHOOK_URL` | `http://app:3000` | Não definir |
| `NEXT_PUBLIC_APP_URL` | `https://app.conext.click` | `http://localhost:3000` |
| `NEXTAUTH_URL` | `https://app.conext.click` | `http://localhost:3000` |
| `UZAPI_URL` | `http://uzapi:8080` | `http://localhost:21465` |
