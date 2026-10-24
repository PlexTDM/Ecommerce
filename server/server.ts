import { Hono } from "hono";
import { logger } from "hono/logger";
import mongoose from "mongoose";
import ora from "ora";
import { getEnv } from "./env.ts";
import corsConfig from "./middleware/cors.ts";
import limiter from "./middleware/rateLimit.ts";
import router from "./routes/route.ts";
import { initRedis } from "./services/cache.ts";
import type { AppEnv } from "./types.ts";

export const app = new Hono<AppEnv>();

app.use(corsConfig);
app.use(logger());
app.use(limiter);
app.route("/", router);

async function start(): Promise<void> {
  try {
    getEnv();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  const env = getEnv();
  const spinner = ora({
    discardStdin: false,
    text: "Starting services...",
    color: "green",
    interval: 100,
    stream: process.stdout,
  }).start();

  spinner.text = "Connecting to Redis...";
  const redisReady = await initRedis(env.REDIS_URL);

  if (!redisReady) {
    console.warn("Redis unavailable or not configured; cache disabled");
  }

  spinner.text = "Connecting to MongoDB...";

  try {
    await mongoose.connect(env.MONGO_URI);
  } catch (error) {
    spinner.fail("MongoDB connection failed");
    console.error(error);
    process.exit(1);
  }

  spinner.succeed("All services connected");

  const server = Bun.serve({
    development: Bun.env.NODE_ENV !== "production",
    port: env.PORT ?? 3000,
    fetch: app.fetch,
    maxRequestBodySize: 16 * 1024 * 1024,
  });

  console.log(`Server running on http://${server.hostname}:${server.port}`);
}

if (import.meta.main) {
  void start();
}
