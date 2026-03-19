import { cors } from "hono/cors";

const allowedOrigins = Bun.env.CORS_ALLOWED_ORIGINS || "";
const allowedOriginsArray = allowedOrigins
  .split(",")
  .map((item) => item.trim());

const corsConfig = cors({
  origin: (origin) => {
    if (allowedOriginsArray.includes(origin) || !origin) {
      return origin;
    }
    return null;
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  maxAge: 600,
  credentials: true,
});

export default corsConfig;
