import { Global, Module } from '@nestjs/common';
import { RATE_LIMIT_STORE_TOKEN } from './rate-limit/rate-limit-store.interface';
import { InMemoryRateLimitStore } from './rate-limit/in-memory-rate-limit.store';
import { ScanRateLimitGuard } from './rate-limit/scan-rate-limit.guard';
import { PolicyGuard } from './rbac/policy.guard';

@Global()
@Module({
  providers: [
    {
      provide: RATE_LIMIT_STORE_TOKEN,
      useClass: InMemoryRateLimitStore, // Para cambiar a Redis en el futuro: useClass: RedisRateLimitStore
    },
    ScanRateLimitGuard,
    PolicyGuard,
  ],
  exports: [RATE_LIMIT_STORE_TOKEN, ScanRateLimitGuard, PolicyGuard],
})
export class SecurityModule {}
