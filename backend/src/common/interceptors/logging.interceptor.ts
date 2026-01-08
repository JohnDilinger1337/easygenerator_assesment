import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: LoggerService;
  private readonly configService: ConfigService;

  constructor(loggerService: LoggerService, configService: ConfigService) {
    this.logger = loggerService;
    this.configService = configService;
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          this.logger.logRequest(method, url, statusCode, duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          // ??? Log error with stack trace in development mode
          this.logger.error(
            `Request Failed: ${method} ${url} - ${error.message} - Duration: ${duration}ms`,
            this.configService.get('NODE_ENV') === 'development'
              ? error.stack
              : undefined,
          );
        },
      }),
    );
  }
}
