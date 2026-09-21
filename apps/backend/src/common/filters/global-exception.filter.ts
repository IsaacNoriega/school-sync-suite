import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || res;
        errorType = (res as any).error || exception.name;
      } else {
        message = res;
        errorType = exception.name;
      }
    } else if (exception && typeof exception === 'object') {
      const err = exception as any;
      // Manejo específico de colisiones de índices únicos en MongoDB (E11000)
      if (err.code === 11000) {
        status = HttpStatus.CONFLICT;
        errorType = 'ConflictError';
        const duplicateFields = Object.keys(err.keyPattern || {}).join(', ');
        message = duplicateFields
          ? `Registro duplicado detectado para los campos: ${duplicateFields}`
          : 'El registro ya existe en el sistema';
      } else if (err.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        errorType = 'InvalidIdentifier';
        message = `El identificador proporcionado (${err.value}) tiene un formato no válido`;
      } else if (err.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        errorType = 'DatabaseValidationError';
        message = err.message || 'Error de validación en la base de datos';
      } else {
        // Error no controlado de servidor
        this.logger.error(
          `[${requestId}] ${request.method} ${request.url} - Error no controlado: ${err.message}`,
          err.stack,
        );
      }
    } else {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} - Excepción desconocida`,
      );
    }

    // Registrar advertencias para errores 4xx o 5xx controlados
    if (status >= 400 && status < 500) {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} -> ${status} [${errorType}]: ${JSON.stringify(
          message,
        )}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}
