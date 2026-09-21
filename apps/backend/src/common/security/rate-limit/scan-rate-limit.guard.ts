import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  IRateLimitStore,
  RATE_LIMIT_STORE_TOKEN,
  SCAN_RATE_LIMIT_OPTIONS_KEY,
  ScanRateLimitOptions,
} from './rate-limit-store.interface';
import { Response, Request } from 'express';

@Injectable()
export class ScanRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RATE_LIMIT_STORE_TOKEN) private readonly store: IRateLimitStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<ScanRateLimitOptions>(
      SCAN_RATE_LIMIT_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no está decorado, pasa libremente
    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const user = (req as any).user;
    // Llave: prioridad al docente autenticado, fallback a IP
    const clientKey = user?.teacherId || user?.sub || user?.id || req.ip || 'anonymous_scanner';

    const { currentHits, resetTimeMs } = await this.store.increment(clientKey, options.ttlMs);

    const remaining = Math.max(0, options.limit - currentHits);
    const resetTimeSec = Math.ceil(resetTimeMs / 1000);

    // Cabeceras estándar RFC draft-ietf-httpapi-ratelimit-headers
    res.setHeader('RateLimit-Limit', options.limit);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetTimeSec);

    if (currentHits > options.limit) {
      const retryAfterSec = Math.max(1, Math.ceil((resetTimeMs - Date.now()) / 1000));
      res.setHeader('Retry-After', retryAfterSec);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'TOO_MANY_REQUESTS',
          message: 'Límite de escaneos QR excedido. Espere unos segundos antes de reintentar.',
          retryAfterSeconds: retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
