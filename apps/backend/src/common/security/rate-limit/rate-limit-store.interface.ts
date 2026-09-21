export interface RateLimitResult {
  currentHits: number;
  resetTimeMs: number;
}

/**
 * Contrato de Abierto/Cerrado para el almacenamiento del Rate Limiter.
 * Permite alternar de memoria local a Redis u otro proveedor sin alterar el Guard.
 */
export interface IRateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitResult>;
}

export const RATE_LIMIT_STORE_TOKEN = 'SECURITY_RATE_LIMIT_STORE';
export const SCAN_RATE_LIMIT_OPTIONS_KEY = 'security:scan_rate_limit_options';

export interface ScanRateLimitOptions {
  limit: number;
  ttlMs: number;
}
