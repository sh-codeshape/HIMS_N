# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL deps (including devDeps for tsc)
COPY package*.json ./
RUN npm ci

# Copy source + tsconfig, then compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run as non-root for security
RUN addgroup -S hims && adduser -S hims -G hims
USER hims

CMD ["node", "dist/server.js"]
