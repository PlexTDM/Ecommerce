import router from "./routes/route.js";
import limiter from "./middleware/rateLimit.js";
import corsConfig from "./middleware/cors.js";
import mongoose from "mongoose";
import ora from "ora";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { RedisClient } from "bun";
import Bun from "bun";

export const app = new Hono();

app.use(corsConfig);
app.use(logger());
app.use(limiter);
app.route("/", router);

const PORT = Bun.env.PORT || 3000;

if (import.meta.path === Bun.main) {
  const spinner = ora({
    discardStdin: false,
    text: "Starting services...",
    color: "green",
    interval: 100,
    stream: process.stdout,
  }).start();
  try {
    spinner.text = "Connecting to Redis...";
    const redis = new RedisClient();
    await redis.set("foo", "bar");

    spinner.text = "Connecting to MongoDB...";
    await mongoose.connect(Bun.env.MONGO_URI!);

    spinner.succeed("All services connected");

    const server = Bun.serve({
      development: true,
      port: PORT,
      fetch: app.fetch,
      maxRequestBodySize: 16 * 1024 * 1024, //16mb
    });
    console.log(`Server running on http://${server.hostname}:${server.port}`);
  } catch (err) {
    spinner.fail("Startup failed");
    console.error(err);
  }
}
