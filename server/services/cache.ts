import { RedisClient } from "bun";

let client: RedisClient | null = null;

export async function initRedis(url: string | undefined): Promise<boolean> {
  if (!url) return false;

  try {
    const candidate = new RedisClient(url);
    await candidate.connect();
    await candidate.set("ecommerce:cache:health", "ok", "EX", 60);
    client = candidate;
    return true;
  } catch (error) {
    console.warn(
      "Redis unavailable, continuing with cache disabled:",
      error instanceof Error ? error.message : error,
    );
    client = null;
    return false;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!client) return null;

  try {
    return await client.get(key);
  } catch (error) {
    console.warn(
      "Redis get failed, continuing without cache:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 60): Promise<void> {
  if (!client) return;

  try {
    await client.set(key, value, "EX", ttlSeconds);
  } catch (error) {
    console.warn(
      "Redis set failed, continuing without cache:",
      error instanceof Error ? error.message : error,
    );
  }
}
