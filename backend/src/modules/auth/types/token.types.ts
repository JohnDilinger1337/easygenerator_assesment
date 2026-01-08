/**
 * Internal token types and interfaces for the Auth module.
 * These are used internally and should NOT be exposed directly in API responses.
 */

/**
 * JWT Payload structure
 */
export interface TokenPayload {
  sub: string; // User ID
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * Internal token pair (access + refresh)
 * Used only internally, never exposed directly in API responses
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number; // In seconds
  refreshTokenExpiresIn: number; // In seconds
}

/**
 * Token configuration per request
 */
export interface TokenConfig {
  mode: 'cookie' | 'body'; // Determines how tokens are returned/sent
  secure: boolean; // HTTPS only in production
}

/**
 * Token response wrapper for API responses
 * Controls what gets exposed to clients
 */
export interface TokenResponseConfig {
  includeTokensInBody: boolean; // For token mode: include tokens in response body
  setCookies: boolean; // For cookie mode: set HttpOnly cookies
}

/**
 * Refresh token database entry
 */
export interface RefreshTokenRecord {
  userId: string;
  token: string; // SHA256 hash of actual token
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}
