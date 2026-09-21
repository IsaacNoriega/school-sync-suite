import { API_BASE_URL } from '@/config/api';
import { handleAuthError } from './auth';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  router?: any; // Next.js App Router instance opcional para redirección suave en 401/403
  skipAuthErrorHandling?: boolean;
}

/**
 * Cliente HTTP unificado para EducaQR
 * 
 * Reglas arquitectónicas aplicadas:
 * 1. credentials: 'include' habilitado por defecto para transmisión segura de cookies HttpOnly.
 * 2. Cero lectura de tokens en localStorage dentro del cliente para desacoplar el estado de sesión.
 * 3. Detección automática de 401/403 y sanitización de mensajes de error de la API.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    body,
    headers: customHeaders = {},
    router,
    skipAuthErrorHandling = false,
    credentials = 'include',
    ...restOptions
  } = options;

  // Construir URL canónica respetando endpoints relativos o absolutos
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL}${normalizedEndpoint}`;

  const headers = new Headers(customHeaders);

  // Inyectar Content-Type por defecto para payloads JSON
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!headers.has('Content-Type') && !isFormData && body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  // Serializar body si es objeto/array y no FormData o string
  let serializedBody: BodyInit | undefined = undefined;
  if (body !== undefined) {
    if (isFormData || typeof body === 'string') {
      serializedBody = body;
    } else {
      serializedBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      credentials, // Preparado estrictamente para cookies de sesión HttpOnly
      headers,
      body: serializedBody,
    });
  } catch (networkError: any) {
    throw new ApiError(
      networkError?.message || 'Error de conexión con el servidor. Verifica tu conexión a internet.',
      0,
      networkError
    );
  }

  // Manejo centralizado de expiración o sesión no autorizada (401 / 403)
  if (response.status === 401 || response.status === 403) {
    let errorMessage = 'Sesión inválida o expirada. Por favor ingresa de nuevo.';
    try {
      const errData = await response.json();
      if (errData?.message) {
        errorMessage = Array.isArray(errData.message)
          ? errData.message.join(', ')
          : errData.message;
      }
    } catch {
      // Si la respuesta no es JSON, se conserva el mensaje por defecto
    }

    if (!skipAuthErrorHandling) {
      handleAuthError(router, errorMessage);
    }

    throw new ApiError(errorMessage, response.status);
  }

  // Manejo de errores HTTP 4xx y 5xx
  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
    let errorData: any = null;

    try {
      errorData = await response.json();
      if (errorData?.message) {
        errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Fallback al statusText
      }
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Respuestas vacías (204 No Content)
  if (response.status === 204) {
    return null as T;
  }

  // Parseo seguro de respuesta JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

/**
 * Métodos auxiliares de conveniencia
 */
export const api = {
  get: <T = any>(endpoint: string, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default apiFetch;
