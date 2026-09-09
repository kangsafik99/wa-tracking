# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# ---------- deps ----------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# ---------- build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- runtime ----------
# Sengaja TIDAK pakai Next.js "output: standalone" + cherry-pick node_modules:
# CLI prisma (dan dependency transitifnya seperti @prisma/config, effect, dll)
# tidak ke-trace oleh Next.js karena bukan bagian dari kode aplikasi yang
# di-import halaman/route. Bawa node_modules penuh dari stage builder (yang
# sudah termasuk hasil `prisma generate`) supaya `prisma migrate deploy` di
# runtime selalu punya semua dependency yang dia butuh.
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && npm start"]
