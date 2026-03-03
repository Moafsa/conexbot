# Audio reply via ElevenLabs – fix and instructions

## Why the bot was replying only with text (no audio)

The flow for voice messages is: **transcribe → process → generate TTS (ElevenLabs or OpenAI) → send audio**. If the bot sends **only text**, one of these is happening:

1. **ElevenLabs not configured**  
   - **Tenant:** Dashboard → Settings → AI → **ElevenLabs API Key** not set.  
   - **Bot:** Edit Bot → **Voice ID** (ElevenLabs voice ID) not set.  
   If either is missing, the code falls back to OpenAI TTS. If OpenAI also fails (e.g. no key), it catches the error and sends the reply as **text**.

2. **TTS or send failed**  
   - `VoiceService.speak()` throws (e.g. invalid key, network error, or **ffmpeg** missing in the container so OGG conversion fails).  
   - Or `UzapiService.sendMedia()` returns `false` (e.g. WuzAPI error).  
   In both cases the catch/fallback sends **text**.

So the “only text” behaviour is almost always: **missing ElevenLabs (or OpenAI) config**, or **TTS/send error** (check logs).

---

## What was changed in code

### 1. `src/services/engine/processor.ts`

- **Logging before TTS**  
  When the user sends audio and the bot is about to reply with audio, we now log:
  - Whether ElevenLabs API key and Voice ID are present (`elevenLabs=true/false`, `voiceId=set/empty`).
  - A hint to configure **Dashboard → Settings → AI (ElevenLabs API Key)** and **Edit Bot → Voice ID** if either is missing.

- **Explicit tenant key**  
  The TTS call now passes `(bot.tenant as any)?.elevenLabsApiKey` so the tenant’s ElevenLabs key is always used when available.

- **Logging on fallback**  
  - If `sendMedia` returns `false`: log `"[Processor] sendMedia (audio) returned false; falling back to text."`  
  - If `VoiceService.speak` or sending throws: log `"[Processor] TTS or send failed: <message>; sending text fallback."`  
  - On success: log `"[Processor] Audio reply sent successfully."`

So you can see in logs exactly why the reply was text instead of audio (config vs TTS vs send).

### 2. `src/services/engine/voice.ts`

- **Log when ElevenLabs is skipped**  
  When the code does **not** use ElevenLabs (missing API key or Voice ID), it logs:  
  `"[VoiceService] ElevenLabs skipped (missing API key or Voice ID). Using OpenAI TTS fallback."`  
  So you can confirm in logs that the bot is using OpenAI instead of ElevenLabs.

---

## Instructions to apply on your machine and push to Git

1. **Open the project** on your machine (same repo as CONEXAO).

2. **Apply the same edits** as above (already applied in this branch).

3. **Configure the bot** (required for ElevenLabs audio):
   - **Dashboard → Settings → AI**  
     Set **ElevenLabs API Key** (from elevenlabs.io).
   - **Edit Bot**  
     Set **Voice ID** (ElevenLabs voice ID, e.g. from the ElevenLabs voice list).

4. **Ensure ffmpeg is available** where the app runs.
   - The **Dockerfile** has been updated to include `apk add ffmpeg`.

5. **Commit and push**  
   - Current changes are ready to be pushed.

6. **Redeploy**  
   Rebuild/restart your app (or container) so it runs the new code. After that, send a voice message and check logs for the new lines to confirm ElevenLabs is used or why it fell back to text.

---

## Will this persist when the container restarts or the system is updated?

- **Yes**, as long as the new code is part of what you deploy:
  - If you build the image from the repo (e.g. `docker build` from the same branch you pushed), the next build and restart will use the new code.
  - If you use volumes that mount the source from the repo, a pull + restart is enough.
- **Config (API key and Voice ID)** is stored in the database (Tenant and Bot), not in the container filesystem, so it persists across container restarts and redeploys.
- **Summary:** Code changes persist after you commit, push, and redeploy. Container restart or system update does not revert them as long as the running code is the updated version (image or mounted source).
