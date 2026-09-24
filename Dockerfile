# ==============================================================================
# DMi SaaS & EPOS Platform - Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build Application
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat
COPY package.json bun.lock* package-lock.json* ./
RUN npm ci || npm install
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 dmiuser

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server

RUN mkdir -p /app/server_storage && chown -R dmiuser:nodejs /app

USER dmiuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/saas/overview || exit 1

CMD ["node", "dist/server.cjs"]
