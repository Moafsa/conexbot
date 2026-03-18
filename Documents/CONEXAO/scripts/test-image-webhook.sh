#!/bin/bash
# Testa o fluxo de imagens do webhook WhatsApp
# Uso: ./scripts/test-image-webhook.sh [BASE_URL]
# Ex: ./scripts/test-image-webhook.sh http://localhost:3004

BASE_URL="${1:-http://localhost:3000}"

# JPEG mínimo válido (1x1 pixel) em base64 - magic bytes FFD8FF
JPEG_B64="/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="

echo "=== 1. Vision-test (URL) ==="
curl -s -X POST "$BASE_URL/api/debug/vision-test" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/300px-PNG_transparency_demonstration_1.png"}' | jq . 2>/dev/null || cat

echo ""
echo "=== 2. Vision-test (base64 JPEG) ==="
curl -s -X POST "$BASE_URL/api/debug/vision-test" \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$JPEG_B64\"}" | jq . 2>/dev/null || cat

echo ""
echo "=== 3. Webhook com JPEGThumbnail (simula WuzAPI) ==="
# Payload simulando WuzAPI com JPEGThumbnail (jq escapa o base64 corretamente)
JSON_DATA=$(jq -n --arg thumb "$JPEG_B64" '{
  type: "Message",
  event: {
    Info: { ID: "test123", Sender: "5511999999999@c.us", FromMe: false },
    Message: {
      imageMessage: {
        caption: "Teste",
        mimetype: "image/jpeg",
        JPEGThumbnail: $thumb
      }
    }
  }
}' 2>/dev/null)
if [ -z "$JSON_DATA" ]; then
  echo "jq não encontrado - pulando teste 3"
else
  curl -s -X POST "$BASE_URL/api/webhooks/whatsapp" \
    -F "jsonData=$JSON_DATA" \
    -F "token=test_session" | jq . 2>/dev/null || cat
fi

echo ""
echo "=== Verifique debug-today.log para logs do webhook ==="
