import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IAuthorizationPolicy, AUTHORIZATION_POLICY_KEY, AuthenticatedUser } from './authorization-policy.interface';

/**
 * Guard cerrado a modificación que delega la decisión de autorización
 * a la política (IAuthorizationPolicy) configurada.
 */
@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<IAuthorizationPolicy>(
      AUTHORIZATION_POLICY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay política definida, se permite el paso por defecto
    if (!policy) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new UnauthorizedException('No autenticado o token inválido.');
    }

    const isAllowed = await policy.isAuthorized(user, request);

    if (!isAllowed) {
      throw new ForbiddenException(
        `Acceso denegado: El rol '${user.role}' no cumple con los privilegios de la política de seguridad.`,
      );
    }

    return true;
  }
}
