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

# Set ownership
RUN chown -R bomber:bomber /app

USER bomber

# Expose ports: 9998 (WebSocket), 8060 (HTTP static)
EXPOSE 9998 8060

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8060/ || exit 1

# Start both servers
CMD ["sh", "-c", "node server.js & node http_server.js"]
