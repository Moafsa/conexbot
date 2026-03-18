# Fluxo de Áudio Atual - Explicação Detalhada

## 1. O que o WuzAPI envia

Quando o usuário envia um áudio no WhatsApp:

```
WuzAPI recebe → salva em /app/files/user_X/ID.ogg
WuzAPI chama webhook com:
  - file_url: http://localhost:5555/files/user_X/ID.ogg
  - jsonData: { event: { Info: {...}, Message: { audioMessage: {...} } } }
  - token: sessionName do bot
```

**Formato do POST:** O WuzAPI pode enviar como:
- `application/x-www-form-urlencoded` ou `multipart/form-data` → campos `file_url`, `jsonData`, `token`
- `application/json` → body `{ file_url, jsonData }` (file_url na raiz)

---

## 2. URL que está apontando

| Etapa | URL | Quem usa |
|-------|-----|----------|
| **file_url no payload** | `http://localhost:5555/files/user_8/ACD6CF61249B86E4F8EF94E77EC7BCD5.ogg` | WuzAPI coloca isso no webhook |
| **Webhook do app** | `https://app.conext.click/api/webhooks/whatsapp` (Traefik) | WuzAPI chama essa URL |
| **Fetch do áudio** | `http://localhost:5555/files/...` → reescrito para `http://uzapi:8080/files/...` | App tenta baixar o arquivo |

---

## 3. Onde quebra

### Problema 1: `localhost:5555` é inacessível

- **WuzAPI** coloca `localhost:5555` no `file_url` (configuração interna do WuzAPI)
- **App em Docker:** `localhost` = o próprio container do app. Porta 5555 não existe lá → **fetch failed**
- **App no host:** `localhost:5555` = máquina host. WuzAPI em Docker não expõe 5555 (só 8080→21465) → **fetch failed**

### Problema 2: WuzAPI pode não servir `/files/` na porta 8080

- O WuzAPI usa porta **5555** para arquivos (config interna)
- O Docker expõe só **8080** (API)
- Mesmo reescrevendo para `uzapi:8080`, o path `/files/` pode não existir nessa porta

### Problema 3: Formato do webhook (form vs JSON)

- Com **form-urlencoded**: `formData.get('file_url')` deve retornar a URL
- Com **JSON**: `body.file_url` já vem no body
- Se o WuzAPI mudar o formato, o `file_url` pode não ser lido

---

## 4. Fluxo atual (passo a passo)

```
1. Usuário envia áudio no WhatsApp
2. WuzAPI salva em /app/files/user_8/XXX.ogg
3. WuzAPI POST → https://app.conext.click/api/webhooks/whatsapp
   Body: file_url=http://localhost:5555/files/user_8/XXX.ogg
         jsonData={...}
         token=bot-xxx

4. Webhook recebe
   - Se form: body = parse(jsonData), body.file_url = formData.get('file_url')
   - Se JSON: body tem file_url na raiz

5. Detecta áudio: audioMessage OU (Type=media && MediaType=ptt)

6. mediaUrl = body.file_url || audioMessage.url
   → body.file_url = "http://localhost:5555/files/user_8/XXX.ogg"

7. Reescreve URL: localhost:5555 → uzapi:8080
   fetchUrl = "http://uzapi:8080/files/user_8/XXX.ogg"

8. fetch(fetchUrl) 
   → FALHA se: uzapi inacessível, ou /files/ não existe em 8080

9. Se fetch OK: salva em temp, transcreve, envia pro buffer
10. Buffer flush → MessageProcessor com inputType: 'audio'
11. TTS → envia áudio de volta
```

---

## 5. Variáveis de ambiente relevantes

| Variável | Produção (Docker) | Desenvolvimento |
|----------|-------------------|-----------------|
| `UZAPI_URL` | `http://uzapi:8080` | `http://localhost:21465` |
| Webhook URL | `https://app.conext.click/...` (Traefik) ou `http://app:3000/...` (rede Docker) | ~~`http://host.docker.internal:3004/...`~~ |

---

## 6. O que verificar

1. **WuzAPI serve arquivos em qual porta?**  
   - Se for 5555 e não estiver exposta no Docker, o fetch sempre falha.

2. **App e WuzAPI na mesma rede Docker?**  
   - `uzapi:8080` só funciona se ambos estiverem na mesma rede.

3. **Path `/files/` na API 8080?**  
   - Testar: `curl http://uzapi:8080/files/user_8/ALGUM_ID.ogg` (de dentro do container do app).

4. **Logs do webhook:**  
   - Conferir se `file_url` aparece em `Form Data - file_url:` ou `Audio Candidates - file_url:`.
