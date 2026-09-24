# ==============================================================================
# DMi SaaS & EPOS Platform - Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build Application
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package descriptors
COPY package.json bun.lock* package-lock.json* ./

# Install all dependencies (including devDependencies required for vite & esbuild)
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build the client SPA and bundled server executable
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Ensure security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 dmiuser

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary production files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server

# Create storage directory for offline SQLite / sync snapshots
RUN mkdir -p /app/server_storage && chown -R dmiuser:nodejs /app

USER dmiuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/saas/overview || exit 1

# Start the optimized Node.js server
CMD ["node", "dist/server.cjs"]
