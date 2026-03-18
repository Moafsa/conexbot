# Análise do Fluxo de Áudio - Mensagens de Voz

## Resumo dos problemas encontrados e correções

### 1. **Recebimento de áudio (webhook)**

**Problema:** O WuzAPI envia o webhook com `multipart/form-data` ou `x-www-form-urlencoded`. O `file_url` vem como campo separado do form, não dentro do `jsonData`. O código só lia `body.file_url`, que vinha vazio quando o body era parseado apenas do `jsonData`.

**Correção:** Ler `formData.get('file_url')` e injetar em `body.file_url` antes do processamento.

---

### 2. **Download do áudio (fetch failed)**

**Problema:** O `file_url` é `http://localhost:5555/files/user_8/xxx.ogg`. Quando o app roda em Docker, `localhost` aponta para o próprio container, não para o WuzAPI. O fetch falhava com "fetch failed".

**Correção:** Substituir `localhost`/`127.0.0.1` pelo host do `UZAPI_URL` (ex: `http://uzapi:8080`). O WuzAPI em Docker expõe a API e os arquivos na mesma porta (8080).

**Variável de ambiente:** `UZAPI_URL=http://uzapi:8080` (já usada no docker-compose de produção).

---

### 3. **Detecção de áudio (WuzAPI)**

**Problema:** O WuzAPI pode enviar áudio com `Info.Type=media` e `Info.MediaType=ptt` sem `Message.audioMessage` explícito em alguns casos.

**Correção:** Considerar áudio quando `(info.Type === 'media' && info.MediaType === 'ptt')` mesmo sem `audioMessage` no payload.

---

### 4. **Buffer perdia o tipo de entrada (TTS não disparava)**

**Problema:** O `BufferingService` ao dar flush sempre passava `inputType: 'text'`. Assim, mesmo quando a mensagem vinha de áudio transcrito, o processor respondia em texto e não em TTS.

**Correção:** Guardar `hadAudio` no buffer e, no flush, passar `inputType: 'audio'` quando houve áudio, para o processor enviar resposta em TTS.

---

### 5. **Envio de áudio (status 400 no WuzAPI)**

**Observação nos logs:** Algumas chamadas a `/chat/send/audio` retornam 400. O formato esperado pelo WuzAPI é:

```json
{"Phone":"5491155554444","Audio":"data:audio/ogg;base64,T2dnUw..."}
```

O código já usa esse formato. Possíveis causas do 400:

- **Formato do áudio:** O WuzAPI exige OGG/Opus. O `VoiceService` converte MP3 → OGG com ffmpeg.
- **Configuração TTS:** ElevenLabs ou OpenAI TTS precisam estar configurados (Dashboard → Settings → AI; Edit Bot → Voice ID).
- **ffmpeg no container:** O Dockerfile deve ter `ffmpeg` instalado para a conversão.

**Logs adicionados:** Em caso de erro no `sendMedia`, o log agora inclui `urlLength` e `phone` para facilitar o debug.

---

## Fluxo completo de áudio

```
1. Usuário envia áudio no WhatsApp
2. WuzAPI salva em /app/files/user_X/xxx.ogg
3. WuzAPI chama webhook com file_url + jsonData (form)
4. Webhook: lê file_url do form, reescreve URL (localhost→uzapi:8080), faz fetch
5. Webhook: salva em temp, chama VoiceService.transcribe()
6. Webhook: BufferingService.add(..., 'audio')
7. Após delay: BufferingService.flush() com hadAudio=true
8. MessageProcessor.process(..., { inputType: 'audio' })
9. IA gera resposta em texto
10. VoiceService.speak() → MP3 → ffmpeg → OGG
11. UzapiService.sendMedia(..., 'audio', dataUri)
12. WuzAPI /chat/send/audio → WhatsApp
```

---

## Checklist para áudio funcionar

- [ ] `UZAPI_URL` apontando para o WuzAPI (ex: `http://uzapi:8080`)
- [ ] OpenAI ou Gemini configurado para transcrição
- [ ] ElevenLabs ou OpenAI TTS configurado (Settings → AI; Edit Bot → Voice ID)
- [ ] ffmpeg instalado no container do app
- [ ] Buffer do bot: `messageBuffer` > 0 para agrupar mensagens (ou 0 para processar imediato)
