-- Bot.onboardingData: restaurant onboarding / order memory (schema drift fix)
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "onboardingData" JSONB;
