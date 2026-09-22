import { SetMetadata } from '@nestjs/common';
import { IAuthorizationPolicy, AUTHORIZATION_POLICY_KEY } from './authorization-policy.interface';

/**
 * Decorador para adjuntar una política de autorización conforme al Principio de Abierto/Cerrado.
 */
export const RequirePolicy = (policy: IAuthorizationPolicy) =>
  SetMetadata(AUTHORIZATION_POLICY_KEY, policy);
