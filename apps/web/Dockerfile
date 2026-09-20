# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/web/package*.json ./apps/web/

# Install dependencies across workspaces
RUN npm install

# Copy source
COPY packages/types ./packages/types
COPY apps/web ./apps/web

# Build
RUN npm --workspace=packages/types run build
RUN npm --workspace=apps/web run build

# Production Nginx Runner
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
