# ─── Stage 1: deps ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json package-lock.json* yarn.lock* ./
RUN npm ci --omit=dev

# ─── Stage 2: production image ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -S bomber && adduser -S bomber -G bomber

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY server.js ./
COPY index.html ./
COPY js/ ./js/
COPY css/ ./css/
COPY assets/ ./assets/
COPY background/ ./background/
COPY util/ ./util/
COPY package.json ./

# Set ownership
RUN chown -R bomber:bomber /app

USER bomber

# Expose the unified server port
EXPOSE 8060

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8060/api/ping || exit 1

ENV NODE_ENV=production
ENV PORT=8060

CMD ["node", "server.js"]
