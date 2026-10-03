# ==============================================================================
# PetVerse API — Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Copy root workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy packages
COPY packages/ ./packages/

# Copy API app
COPY apps/api/ ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages and api
RUN pnpm --filter @petverse/shared-constants build || true
RUN pnpm --filter @petverse/shared-types build || true
RUN pnpm --filter @petverse/api run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Enable pnpm in runner for runtime dependency isolation
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Copy workspace files for production install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Security: Non-root user
USER node

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
