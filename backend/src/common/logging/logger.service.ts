import {
  Injectable,
  Logger as NestLogger,
  LoggerService as NestLoggerService,
} from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: NestLogger;
  private context?: string;

  constructor() {
    this.logger = new NestLogger();
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.log(message, context || this.context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context || this.context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context || this.context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context || this.context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, context || this.context);
  }

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
  ) {
    this.log(`${method} ${url} ${statusCode} - ${duration}ms`, 'HTTP');
  }

  logAuth(action: string, email: string, success: boolean, ip?: string) {
    const status = success ? 'SUCCESS' : 'FAILED';
    this.log(
      `Auth ${action}: ${email} - ${status}${ip ? ` from ${ip}` : ''}`,
      'AUTH',
    );
  }

  logError(error: Error, context?: string) {
    this.error(error.message, error.stack, context || this.context);
  }
}
