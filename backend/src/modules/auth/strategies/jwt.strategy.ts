import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { LoggerService } from '@/common/logging/logger.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger: LoggerService;

  constructor(configService: ConfigService, loggerService: LoggerService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Try to get token from cookie first
          if (request?.cookies?.['accessToken']) {
            return request.cookies['accessToken'];
          }
          // Fallback to Authorization header for backward compatibility
          return ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        configService.get<string>('auth.jwt.secret'),
    });
    this.logger = loggerService;
    this.logger.setContext('JwtStrategy');
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub || !payload?.email) {
      this.logger.error(
        'Invalid JWT payload: missing sub or email',
        payload.email,
        'JwtStrategy',
      );
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
