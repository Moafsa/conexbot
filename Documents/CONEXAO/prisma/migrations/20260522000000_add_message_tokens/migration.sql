-- AddColumn: token tracking per AI response on Message
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "aiProvider" TEXT;
