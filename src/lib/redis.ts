/**
 * Redis Client for ALO Education
 * 
 * Uses ioredis for production Redis 7.x integration.
 * Falls back gracefully when Redis is not configured.
 * 
 * Usage:
 *   import { redis } from "@/lib/redis";
 *   await redis.set("key", "value", "EX", 3600);
 *   const value = await redis.get("key");
 */

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  ping(): Promise<string>;
  disconnect(): Promise<void>;
}

// In-memory fallback when Redis is not configured
class MemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string | null> {
    const entry: { value: string; expiresAt?: number } = { value };
    if (mode === "EX" && duration) {
      entry.expiresAt = Date.now() + duration * 1000;
    }
    this.store.set(key, entry);
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || "0", 10);
    const next = current + 1;
    await this.set(key, String(next));
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || !entry.expiresAt) return -1;
    return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async disconnect(): Promise<void> {
    this.store.clear();
  }
}

let redisInstance: RedisLike | null = null;
let initialized = false;

async function getRedisClient(): Promise<RedisLike> {
  if (redisInstance) return redisInstance;

  if (!initialized) {
    initialized = true;
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      try {
        // Dynamic import of ioredis — only loaded if REDIS_URL is set
        // @ts-ignore - ioredis may not be installed in sandbox
        const Redis = (await import("ioredis")).default;
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => Math.min(times * 500, 2000),
        });

        client.on("error", (err) => {
          console.error("[Redis] Error:", err.message);
        });

        client.on("connect", () => {
          console.log("[Redis] Connected to", process.env.REDIS_URL?.replace(/:[^:@]+@/, ":****@"));
        });

        redisInstance = client as unknown as RedisLike;
      } catch (error) {
        console.warn("[Redis] Failed to connect, using memory fallback:", error);
        redisInstance = new MemoryRedis();
      }
    } else {
      console.warn("[Redis] REDIS_URL not set, using in-memory fallback");
      redisInstance = new MemoryRedis();
    }
  }

  return redisInstance!;
}

// Export a lazy proxy that initializes on first use
export const redis: RedisLike = new Proxy({} as RedisLike, {
  get(_target, prop) {
    return (...args: unknown[]) => {
      return getRedisClient().then((client) => (client as any)[prop](...args));
    };
  },
});

// Helper: Rate limiting using Redis
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const client = await getRedisClient();
  const redisKey = `ratelimit:${key}`;
  const current = await client.incr(redisKey);

  if (current === 1) {
    await client.expire(redisKey, windowSeconds);
  }

  const ttl = await client.ttl(redisKey);
  const remaining = Math.max(0, maxRequests - current);
  const allowed = current <= maxRequests;
  const resetAt = Date.now() + ttl * 1000;

  return { allowed, remaining, resetAt };
}

// Helper: Cache with TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const value = await client.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  const client = await getRedisClient();
  await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(key);
}

// Helper: Distributed lock
export async function acquireLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
  const client = await getRedisClient();
  const lockKey = `lock:${key}`;
  const result = await client.set(lockKey, "1", "EX", ttlSeconds);
  return result === "OK";
}

export async function releaseLock(key: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(`lock:${key}`);
}
