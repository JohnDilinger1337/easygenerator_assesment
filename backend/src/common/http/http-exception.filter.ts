import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpErrorType } from './http-error-type';
import { ErrorType } from '../enums';
import { LoggerService } from '../logging/logger.service';

interface ErrorResponse {
  statusCode: number;
  errorType: ErrorType | string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly isDevelopment: boolean;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext('HttpExceptionFilter');
    this.isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse() as {
      errorType?: ErrorType | string;
      message: string | string[];
      error?: string;
    };

    const errorType =
      exceptionResponse.errorType ??
      HttpErrorType[status] ??
      'UNEXPECTED_ERROR';

    const message = Array.isArray(exceptionResponse.message)
      ? exceptionResponse.message
      : exceptionResponse.message ||
        exceptionResponse.error ||
        'An error occurred';

    const errorDetails = [
      `Status: ${status}`,
      `Type: ${errorType}`,
      `Path: ${request.method} ${request.url}`,
      `Message: ${Array.isArray(message) ? message.join(', ') : message}`,
      request.ip ? `IP: ${request.ip}` : '',
      (request as any).user?.id ? `User: ${(request as any).user.id}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    this.logger.error(errorDetails);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      errorType,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (this.isDevelopment) {
      (errorResponse as any).stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
