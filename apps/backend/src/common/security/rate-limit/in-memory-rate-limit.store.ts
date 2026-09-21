import { Injectable } from '@nestjs/common';
import { IRateLimitStore, RateLimitResult } from './rate-limit-store.interface';

interface MemoryRecord {
  hits: number;
  resetTimeMs: number;
}

/**
 * Implementación de RateLimitStore en memoria local con purga periódica.
 */
@Injectable()
export class InMemoryRateLimitStore implements IRateLimitStore {
  private readonly hitsMap = new Map<string, MemoryRecord>();

  constructor() {
    // Purga periódica de registros expirados cada minuto
    setInterval(() => this.cleanup(), 60_000).unref();
  }

  public async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const record = this.hitsMap.get(key);

    if (!record || now > record.resetTimeMs) {
      const newRecord: MemoryRecord = {
        hits: 1,
        resetTimeMs: now + windowMs,
      };
      this.hitsMap.set(key, newRecord);
      return { currentHits: 1, resetTimeMs: newRecord.resetTimeMs };
    }

    record.hits += 1;
    return { currentHits: record.hits, resetTimeMs: record.resetTimeMs };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.hitsMap.entries()) {
      if (now > record.resetTimeMs) {
        this.hitsMap.delete(key);
      }
    }
  }
}
