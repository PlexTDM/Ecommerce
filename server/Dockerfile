# ── Stage 1: Build ──────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json ./
RUN bun install --production

# ── Stage 2: Production ─────────────────────────────
FROM oven/bun:1-slim AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 8888

CMD ["bun", "run", "server.ts"]
