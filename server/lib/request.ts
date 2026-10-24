import type { Context } from "hono";
import type { AppEnv } from "../types.ts";

export async function readRequestBody(c: Context<AppEnv>): Promise<unknown> {
  try {
    return await c.req.json<unknown>();
  } catch {
    try {
      return await c.req.parseBody();
    } catch {
      return null;
    }
  }
}
