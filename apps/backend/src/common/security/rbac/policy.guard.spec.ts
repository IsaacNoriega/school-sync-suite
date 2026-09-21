import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyGuard } from './policy.guard';
import { IAuthorizationPolicy, AuthenticatedUser } from './authorization-policy.interface';

describe('PolicyGuard (Unit)', () => {
  let guard: PolicyGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockExecutionContext = (user?: AuthenticatedUser): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new PolicyGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe permitir el acceso si no hay política configurada en el endpoint', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockExecutionContext();

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('debe lanzar UnauthorizedException (401) si no existe usuario autenticado en request.user', async () => {
    const mockPolicy: IAuthorizationPolicy = { isAuthorized: jest.fn() };
    reflector.getAllAndOverride.mockReturnValue(mockPolicy);
    const context = createMockExecutionContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(mockPolicy.isAuthorized).not.toHaveBeenCalled();
  });

  it('debe lanzar ForbiddenException (403) si la política rechaza al usuario', async () => {
    const mockPolicy: IAuthorizationPolicy = {
      isAuthorized: jest.fn().mockResolvedValue(false),
    };
    reflector.getAllAndOverride.mockReturnValue(mockPolicy);
    const context = createMockExecutionContext({
      id: 'usr_1',
      email: 'student@school.com',
      role: 'STUDENT',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockPolicy.isAuthorized).toHaveBeenCalledTimes(1);
  });

  it('debe conceder acceso si el usuario satisface la política (ej. TEACHER)', async () => {
    const mockPolicy: IAuthorizationPolicy = {
      isAuthorized: jest.fn().mockResolvedValue(true),
    };
    reflector.getAllAndOverride.mockReturnValue(mockPolicy);
    const context = createMockExecutionContext({
      id: 'teacher_1',
      email: 'prof@school.com',
      role: 'TEACHER',
      teacherId: 't_123',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPolicy.isAuthorized).toHaveBeenCalledTimes(1);
  });
});
