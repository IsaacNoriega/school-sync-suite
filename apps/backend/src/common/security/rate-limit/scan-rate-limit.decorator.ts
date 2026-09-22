import { SetMetadata } from '@nestjs/common';
import { SCAN_RATE_LIMIT_OPTIONS_KEY, ScanRateLimitOptions } from './rate-limit-store.interface';

/**
 * Decorador para aplicar rate limiting específico a endpoints de escaneo.
 * @param limit Número máximo de peticiones permitidas en la ventana
 * @param ttlMs Duración de la ventana en milisegundos (por defecto 60,000ms = 1 minuto)
 */
export const ScanRateLimit = (limit: number = 45, ttlMs: number = 60_000) =>
  SetMetadata(SCAN_RATE_LIMIT_OPTIONS_KEY, { limit, ttlMs } as ScanRateLimitOptions);
