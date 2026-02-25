# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -S bomber && adduser -S bomber -G bomber

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application files
COPY package.json ./
COPY server.js ./
COPY http_server.js ./
COPY index.html ./
COPY js/ ./js/
COPY css/ ./css/
COPY assets/ ./assets/
COPY background/ ./background/
COPY i/ ./i/
COPY util/ ./util/
COPY server/ ./server/

# Create .db directory for runtime data
RUN mkdir -p /app/.db && chown -R bomber:bomber /app

USER bomber

# Unified server: HTTP + Socket.io + API on port 9998
EXPOSE 9998

# Health check against the unified server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9998/ || exit 1

CMD ["node", "server.js"]
