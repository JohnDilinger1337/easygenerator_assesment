import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureCookie = process.env.COOKIE_SECURE === 'true' || isProduction;

  return {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      refreshSecret:
        process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
      expiresIn: process.env.JWT_EXPIRES_IN || 900,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || 604800,
    },
    password: {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    security: {
      rateLimit: {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
      secureCookie,
    },
  };
});
