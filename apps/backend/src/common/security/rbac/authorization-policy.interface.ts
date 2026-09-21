export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  teacherId?: string;
  [key: string]: unknown;
}

/**
 * Contrato del Principio de Abierto/Cerrado (OCP) para políticas de autorización.
 * Cualquier nueva regla o rol implementa esta interfaz sin modificar los guards existentes.
 */
export interface IAuthorizationPolicy {
  isAuthorized(user: AuthenticatedUser, context?: any): boolean | Promise<boolean>;
}

export const AUTHORIZATION_POLICY_KEY = 'security:authorization_policy';
