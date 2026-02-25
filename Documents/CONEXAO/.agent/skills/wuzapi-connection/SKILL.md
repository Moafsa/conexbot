---
name: wuzapi-connection
description: Diagnose and fix WuzAPI connection issues, including Docker container status and network reachability.
---

# WuzAPI Connection Skill

This skill helps diagnose and resolve connection issues between the Next.js application and the WuzAPI (WhatsApp Gateway) service.

## 1. Quick Fix (Try This First)

If your bot is connected but not responding, or connection fails after restart, run this auto-fixer:

```bash
npx ts-node .agent/skills/wuzapi-connection/scripts/fix_webhooks.ts
```

This script will:
1.  Check if WuzAPI is reachable.
2.  List all active sessions (bots).
3.  **Force update the webhook URL** for every bot to point to `http://host.docker.internal:3000/api/webhooks/whatsapp`.

---

## 2. Diagnostic Steps

When the connection fails (e.g., "Failed to create/verify user in WuzAPI"), follow these steps:

### Check Docker Status
The WuzAPI service runs in a Docker container (usually named `clawdbot-24-7` or similar).
Run the following checks:

```bash
# Check if container is running
docker ps --filter "name=clawdbot"

# Check container logs if running but failing
docker logs clawdbot-24-7 --tail 50
```

### Verify Reachability
The application tries to connect to `http://localhost:21465` (default).
If on Windows/Mac, sometimes `localhost` resolves to IPv6 `::1` which Docker might not bind. Try `http://127.0.0.1:21465`.

Run the diagnostic script:
```bash
npx ts-node .agent/skills/wuzapi-connection/scripts/check_status.ts
```

## 3. Webhook Configuration
The common cause for "connected but silent" is the Webhook URL.
Inside Docker, `localhost` refers to the container itself.
To reach the Next.js app on the host machine, we MUST use:
-   **Windows/Mac**: `http://host.docker.internal:3000`
-   **Linux**: `http://172.17.0.1:3000` (usually)

The `fix_webhooks.ts` script handles this for Windows/Mac environments automatically.
