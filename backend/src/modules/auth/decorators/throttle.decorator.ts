import { Throttle } from '@nestjs/throttler';

/**
 * Rate limiting decorator for authentication endpoints
 * Uses configurable limits from environment variables
 * Default: 5 requests per minute
 */
export const ThrottleAuth = () =>
  Throttle({
    default: { limit: 5, ttl: 60000 }, // 5 requests per minute (60 seconds)
  });

/**
 * Rate limiting decorator for registration endpoint
 * Stricter limit to prevent abuse
 * Default: 3 requests per minute
 */
export const ThrottleRegister = () =>
  Throttle({
    default: { limit: 3, ttl: 60000 }, // 3 requests per minute
  });

/**
 * Rate limiting decorator for refresh token endpoint
 * Default: 10 requests per minute
 */
export const ThrottleRefresh = () =>
  Throttle({
    default: { limit: 10, ttl: 60000 }, // 10 requests per minute
  });
