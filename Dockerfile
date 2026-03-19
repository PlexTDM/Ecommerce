# ── Stage 1: Build ──────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

ARG VITE_BACK_END_API=/api
ENV VITE_BACK_END_API=$VITE_BACK_END_API

RUN bun run build

# ── Stage 2: Serve ──────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]