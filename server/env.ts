import { z } from "zod";

const envSchema = z.object({
  MONGO_URI: z.string().min(1),
  SECRET_ACCESS_TOKEN: z.string().min(1),
  SECRET_REFRESH_TOKEN: z.string().min(1),
  PAYPAL_CLIENT_ID: z.string().min(1),
  PAYPAL_CLIENT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().optional(),
  REDIS_URL: z.string().min(1).optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  PAYPAL_API_BASE: z.string().url().default("https://api-m.sandbox.paypal.com"),
  PAYPAL_MOCK: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true" || value === "1"),
  TRUST_PROXY: z
    .union([z.boolean(), z.string()])
    .default("false")
    .transform((value) =>
      typeof value === "boolean" ? value : value.toLowerCase() === "true" || value === "1",
    ),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(Bun.env);
  if (!result.success) {
    const details = z.flattenError(result.error);
    throw new Error(
      `Environment variable validation failed: ${JSON.stringify(details.fieldErrors)}`,
    );
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function resetEnvCacheForTests(): void {
  cachedEnv = undefined;
}
