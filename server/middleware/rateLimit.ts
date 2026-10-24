import { rateLimiter } from "hono-rate-limiter";
import type { Context } from "hono";
import type { AppEnv } from "../types.ts";

const limiter = rateLimiter<AppEnv>({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { error: "Too many requests, please try again later." },
  keyGenerator: (c: Context<AppEnv>) =>
    c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown",
  standardHeaders: "draft-6",
});

export default limiter;
