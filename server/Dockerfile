FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .

EXPOSE 8888

CMD ["bun", "run", "server.js"]
