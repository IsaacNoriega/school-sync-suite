import { IAuthorizationPolicy, AuthenticatedUser } from '../authorization-policy.interface';

/**
 * Política de autorización basada en roles (RBAC).
 * Abierta a cualquier lista de roles sin modificar su lógica interna.
 */
export class RoleBasedPolicy implements IAuthorizationPolicy {
  constructor(private readonly allowedRoles: readonly string[]) {}

  public isAuthorized(user: AuthenticatedUser): boolean {
    if (!user || !user.role) {
      return false;
    }
    return this.allowedRoles.includes(user.role);
  }
}
