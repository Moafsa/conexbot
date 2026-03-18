# Multi-stage build for Next.js production

# 1. Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
# Install all dependencies (including devDependencies) for the build
RUN npm ci

# 2. Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Build limpo: evita cache corrompido que pode quebrar rotas (ex.: /admin) em produção
RUN rm -rf .next && NODE_ENV=production npm run build

# 3. Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# ffmpeg necessário para TTS: conversão MP3→OGG/Opus (mensagens de voz no WhatsApp)
RUN apk add --no-cache libc6-compat ffmpeg && ffmpeg -version
# Install prisma CLI globaly to have it available for DB management in production
RUN npm install -g prisma@7.5.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma - Copy prisma folder and config for the CLI
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
# Client is already in standalone/node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
