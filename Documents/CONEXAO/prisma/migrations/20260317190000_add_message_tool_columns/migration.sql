-- AlterTable Message: add tool_call_id and tool_calls for OpenAI tool calling support
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "tool_call_id" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "tool_calls" JSONB;

-- AlterTable Contact: add eventDate, assignedBotId, isBlocked
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "assignedBotId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN DEFAULT false;

-- AlterTable Conversation: add pausedUntil (handoff para humano)
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "pausedUntil" TIMESTAMP(3);
