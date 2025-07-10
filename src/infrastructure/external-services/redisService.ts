import Redis from "ioredis";
import { config } from "../../configs/config";

class RedisService {
  private client: Redis | null = null;

  async connect(): Promise<void> {
    try {
      this.client = new Redis(config.redis.url);

      this.client.on("error", (error) => {
        console.error("Redis error:", error);
      });

      this.client.on("connect", () => {
        console.log("Connected to Redis");
      });
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async set(
    key: string,
    value: string,
    expirationInSeconds?: number
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    if (expirationInSeconds) {
      await this.client.setex(key, expirationInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    return await this.client.get(key);
  }

  async delete(key: string): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const result = await this.client.exists(key);
    return result === 1;
  }

  async setHash(key: string, field: string, value: string): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    await this.client.hset(key, field, value);
  }

  async getHash(key: string, field: string): Promise<string | null> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    return await this.client.hget(key, field);
  }

  async deleteHash(key: string, field: string): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    await this.client.hdel(key, field);
  }

  async increment(key: string): Promise<number> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    return await this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    await this.client.expire(key, seconds);
  }

  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      console.error("Redis ping failed:", error);
      return false;
    }
  }

  async flushAll(): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    await this.client.flushall();
  }

  async getKeys(pattern: string): Promise<string[]> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    return await this.client.keys(pattern);
  }

  async setWithExpiry(
    key: string,
    value: string,
    expirySeconds: number
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    await this.client.set(key, value, "EX", expirySeconds);
  }

  async multiSet(keyValues: Record<string, string>): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const pipeline = this.client.pipeline();
    Object.entries(keyValues).forEach(([key, value]) => {
      pipeline.set(key, value);
    });
    await pipeline.exec();
  }

  async getClient(): Promise<Redis> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }
    return this.client;
  }
}

export const redisService = new RedisService();
