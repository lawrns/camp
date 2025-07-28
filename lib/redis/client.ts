// Redis Client stub
export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
}

export class RedisClient {
  private static instance: RedisClient | undefined;
  private connected: boolean = false;
  private cache: Map<string, { value: unknown; expires: number }> = new Map();

  static getInstance(config?: RedisConfig): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(config);
    }
    return RedisClient.instance;
  }

  constructor(private config?: RedisConfig) {
    // Stub implementation - simulate connection
    this.connected = true;
    void config; // Suppress unused parameter warning
  }

  async connect(): Promise<void> {
    // Stub implementation
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    // Stub implementation
    this.connected = false;
    this.cache.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return typeof item.value === "string" ? item.value : JSON.stringify(item.value);
  }

  async set(key: string, value: string, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || 3600; // Default 1 hour
    const expires = Date.now() + ttl * 1000;

    this.cache.set(key, { value, expires });
  }

  async del(key: string): Promise<number> {
    const deleted = this.cache.has(key) ? 1 : 0;
    this.cache.delete(key);
    return deleted;
  }

  async exists(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return 0;

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return 0;
    }

    return 1;
  }

  async expire(key: string, ttl: number): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return 0;

    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { ...item, expires });
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return -2; // Key doesn't exist

    const remaining = Math.floor((item.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1; // -1 means expired
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching for stub
    const allKeys = Array.from(this.cache.keys());

    if (pattern === "*") {
      return allKeys;
    }

    // Basic wildcard support
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return allKeys.filter((key: any) => regex.test(key));
  }

  async flushall(): Promise<void> {
    this.cache.clear();
  }

  // JSON operations
  async getJSON<T = unknown>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJSON(key: string, value: unknown, options?: CacheOptions): Promise<void> {
    await this.set(key, JSON.stringify(value), options);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    const hashKey = `${key}:${field}`;
    return this.get(hashKey);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    const hashKey = `${key}:${field}`;
    await this.set(hashKey, value);
  }

  async hdel(key: string, field: string): Promise<number> {
    const hashKey = `${key}:${field}`;
    return this.del(hashKey);
  }
}

// Default client instance
export const redisClient = RedisClient.getInstance({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  db: parseInt(process.env.REDIS_DB || "0"),
});

// Export for backward compatibility
export const redis = redisClient;

export default RedisClient;
