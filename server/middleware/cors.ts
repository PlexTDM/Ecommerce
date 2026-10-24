import { cors } from "hono/cors";
import { getEnv } from "../env.ts";
import type { AppEnv } from "../types.ts";
import type { MiddlewareHandler } from "hono";

const corsConfig: MiddlewareHandler<AppEnv> = cors({
  origin: (origin) => {
    if (!origin) return null;

    const allowedOrigins = (getEnv().CORS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return allowedOrigins.includes(origin) ? origin : null;
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 600,
  credentials: true,
});

export default corsConfig;
