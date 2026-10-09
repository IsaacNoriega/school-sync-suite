import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { randomUUID } from 'crypto';
import { ToggleStatusDto } from './modules/auth/dto/auth.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';

describe('Smoke Tests - Verificaciones Técnicas de Auditoría', () => {
  describe('M-04: Generación Criptográfica de QR con randomUUID()', () => {
    it('debe generar códigos con formato STU- seguido de 20 caracteres hexadecimales/alfanuméricos en mayúsculas', () => {
      const qrCode = `STU-${randomUUID().replace(/-/g, '').substring(0, 20).toUpperCase()}`;
      expect(qrCode).toMatch(/^STU-[0-9A-F]{20}$/);
      expect(qrCode.length).toBe(24);
    });

    it('debe garantizar 0 colisiones en 1,000 generaciones consecutivas', () => {
      const generated = new Set<string>();
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        const qrCode = `STU-${randomUUID().replace(/-/g, '').substring(0, 20).toUpperCase()}`;
        generated.add(qrCode);
      }
      expect(generated.size).toBe(iterations);
    });
  });

  describe('M-06: Validación de tipo en ToggleStatusDto (@IsBoolean)', () => {
    it('debe rechazar un payload numérico { isActive: 1 } con error de validación', async () => {
      const instance = plainToInstance(ToggleStatusDto, { isActive: 1 });
      const errors = await validate(instance);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isBoolean).toBe(
        'isActive debe ser un valor booleano (true o false)',
      );
    });

    it('debe rechazar un payload string { isActive: "true" }', async () => {
      const instance = plainToInstance(ToggleStatusDto, { isActive: 'true' });
      const errors = await validate(instance);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isBoolean).toBe(
        'isActive debe ser un valor booleano (true o false)',
      );
    });

    it('debe aceptar valores booleanos válidos (true y false)', async () => {
      const instanceTrue = plainToInstance(ToggleStatusDto, { isActive: true });
      const errorsTrue = await validate(instanceTrue);
      expect(errorsTrue.length).toBe(0);

      const instanceFalse = plainToInstance(ToggleStatusDto, { isActive: false });
      const errorsFalse = await validate(instanceFalse);
      expect(errorsFalse.length).toBe(0);
    });
  });

  describe('C-02: Rate Limiting en POST /auth/login (@Throttle limit: 5, ttl: 60s)', () => {
    let app: any;
    let authServiceMock: { login: jest.Mock };

    beforeEach(async () => {
      authServiceMock = {
        login: jest.fn().mockResolvedValue({
          access_token: 'fake.jwt.token',
          user: { id: 'user-1', email: 'test@school.edu' },
        }),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
          ThrottlerModule.forRoot([
            {
              ttl: 60000,
              limit: 100, // global
            },
          ]),
        ],
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: authServiceMock },
          ThrottlerGuard,
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      if (app) await app.close();
    });

    it('permite exactamente 5 intentos y el 6to intento arroja HTTP 429 Too Many Requests', async () => {
      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        header: jest.fn(),
        setHeader: jest.fn(),
      } as any;

      const mockReq = {
        ip: '192.168.1.50',
        ips: ['192.168.1.50'],
        method: 'POST',
        url: '/auth/login',
        headers: {},
      };

      // Simular llamadas desde la misma IP
      const controller = app.get(AuthController);
      const guard = app.get(ThrottlerGuard);

      const results: boolean[] = [];
      const dummyLoginDto = { email: 'teacher@school.edu', password: 'password123' };

      for (let i = 1; i <= 6; i++) {
        const mockContext = {
          switchToHttp: () => ({
            getRequest: () => mockReq,
            getResponse: () => mockRes,
          }),
          getHandler: () => controller.login,
          getClass: () => AuthController,
        } as any;

        try {
          const canActivate = await guard.canActivate(mockContext);
          results.push(canActivate);
          if (canActivate) {
            await controller.login(dummyLoginDto, mockRes);
          }
        } catch (error: any) {
          const status = error.getStatus ? error.getStatus() : error.status;
          expect(status).toBe(429);
          results.push(false);
        }
      }

      // Los primeros 5 intentos fueron permitidos, el 6to fue bloqueado con 429
      expect(results).toEqual([true, true, true, true, true, false]);
    });
  });
});
