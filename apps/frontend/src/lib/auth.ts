import toast from 'react-hot-toast';

/**
 * Decodifica de forma segura el payload de un token JWT en el cliente
 */
export function decodeJwtPayload(token: string | null): any {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado o está a punto de expirar (buffer de 10 segundos)
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  // payload.exp está en segundos, Date.now() en milisegundos
  const expiresAtMs = payload.exp * 1000;
  // Margen de 10 segundos para prevenir condiciones de carrera
  return expiresAtMs <= Date.now() + 10000;
}

/**
 * Limpia completamente la sesión del usuario en localStorage
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
}

let lastAuthToastTime = 0;

/**
 * Manejador centralizado cuando una petición o verificación de sesión falla (401/403 o token expirado).
 * Limpia la sesión y redirige inmediatamente al login evitando bucles infinitos.
 */
export function handleAuthError(router?: any, customMessage?: string): void {
  clearAuthSession();

  const now = Date.now();
  // Evitar saturar la pantalla con toasts múltiples en un intervalo de 3 segundos
  if (now - lastAuthToastTime > 3000) {
    lastAuthToastTime = now;
    toast.error(customMessage || 'Tu sesión ha expirado. Por favor, ingresa nuevamente.');
  }

  if (router && typeof router.replace === 'function') {
    router.replace('/login');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
