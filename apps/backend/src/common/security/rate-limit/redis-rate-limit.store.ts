import { IRateLimitStore, RateLimitResult } from './rate-limit-store.interface';

export interface IRedisClientLike {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  pttl(key: string): Promise<number>;
}

/**
 * Extensión para Redis sin modificar el ScanRateLimitGuard (Principio de Abierto/Cerrado).
 */
export class RedisRateLimitStore implements IRateLimitStore {
  constructor(private readonly redisClient: IRedisClientLike) {}

  public async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const redisKey = `ratelimit:scan:${key}`;
    const hits = await this.redisClient.incr(redisKey);

    if (hits === 1) {
      await this.redisClient.expire(redisKey, Math.ceil(windowMs / 1000));
    }

    const ttl = await this.redisClient.pttl(redisKey);
    const resetTimeMs = Date.now() + (ttl > 0 ? ttl : windowMs);

    return { currentHits: hits, resetTimeMs };
  }
}
