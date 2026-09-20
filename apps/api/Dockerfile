# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package manifests
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/api/package*.json ./apps/api/

# Install dependencies across workspaces
RUN npm install

# Copy source code
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# Build types and API
RUN npm --workspace=packages/types run build
RUN npm --workspace=apps/api run prisma:generate
RUN npm --workspace=apps/api run build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
