import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScanRateLimitGuard } from './scan-rate-limit.guard';
import { IRateLimitStore, ScanRateLimitOptions } from './rate-limit-store.interface';
import { Response, Request } from 'express';

describe('ScanRateLimitGuard (Unit)', () => {
  let guard: ScanRateLimitGuard;
  let reflector: jest.Mocked<Reflector>;
  let store: jest.Mocked<IRateLimitStore>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSetHeader: jest.Mock;

  const createMockContext = (): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    store = {
      increment: jest.fn(),
    };

    mockSetHeader = jest.fn();
    mockResponse = {
      setHeader: mockSetHeader,
    };

    mockRequest = {
      ip: '192.168.1.50',
      user: { id: 'usr_teacher', teacherId: 't_100', role: 'TEACHER' } as any,
    };

    guard = new ScanRateLimitGuard(reflector, store);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe permitir la solicitud y fijar cabeceras RFC cuando se está bajo el límite', async () => {
    const options: ScanRateLimitOptions = { limit: 45, ttlMs: 60000 };
    reflector.getAllAndOverride.mockReturnValue(options);

    store.increment.mockResolvedValue({
      currentHits: 12,
      resetTimeMs: Date.now() + 50000,
    });

    const context = createMockContext();
    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
    expect(store.increment).toHaveBeenCalledWith('t_100', 60000);
    expect(mockSetHeader).toHaveBeenCalledWith('RateLimit-Limit', 45);
    expect(mockSetHeader).toHaveBeenCalledWith('RateLimit-Remaining', 33);
  });

  it('debe rechazar con 429 y cabecera Retry-After cuando se supera el límite de escaneos', async () => {
    const options: ScanRateLimitOptions = { limit: 45, ttlMs: 60000 };
    reflector.getAllAndOverride.mockReturnValue(options);

    const now = Date.now();
    store.increment.mockResolvedValue({
      currentHits: 46, // Excedido
      resetTimeMs: now + 30000, // Quedan 30 segundos
    });

    const context = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    expect(mockSetHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));

    try {
      await guard.canActivate(context);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(err.getResponse()).toMatchObject({
        error: 'TOO_MANY_REQUESTS',
      });
    }
  });
});
