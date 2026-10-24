import { getConnInfo } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";
import type { Context, MiddlewareHandler } from "hono";
import { getEnv } from "../env.ts";
import type { AppEnv } from "../types.ts";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MESSAGE = { error: "Too many requests, please try again later." };

interface LimiterConfig {
  limit: number;
  windowMs?: number;
}

function clientKey(c: Context<AppEnv>): string {
  if (getEnv().TRUST_PROXY) {
    const forwarded = c.req.header("x-forwarded-for");
    const firstForwarded = forwarded?.split(",")[0]?.trim();

    if (firstForwarded) return firstForwarded;

    return c.req.header("x-real-ip") ?? "unknown";
  }

  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    // `app.request()` and similar test/embedded transports have no Bun server.
    return "unknown";
  }
}

export function createRateLimiter(config: LimiterConfig): MiddlewareHandler<AppEnv> {
  return rateLimiter<AppEnv>({
    windowMs: config.windowMs ?? RATE_LIMIT_WINDOW_MS,
    limit: config.limit,
    message: RATE_LIMIT_MESSAGE,
    keyGenerator: clientKey,
    standardHeaders: "draft-6",
  });
}

export const authRateLimiter = createRateLimiter({ limit: 20 });
export const paymentRateLimiter = createRateLimiter({ limit: 30 });

const limiter = createRateLimiter({ limit: 100 });

export default limiter;
