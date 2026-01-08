import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './jwt.strategy';
import { InvalidTokenException } from '../../../common/exceptions';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Get refresh token from cookie
          if (request?.cookies?.['refreshToken']) {
            return request.cookies['refreshToken'];
          }
          // Fallback to body for backward compatibility
          return request?.body?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ||
        configService.get<string>('auth.jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken =
      req.cookies?.['refreshToken'] || req.body?.refreshToken;

    if (!refreshToken) {
      throw new InvalidTokenException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
