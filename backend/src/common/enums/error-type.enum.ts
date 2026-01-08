export enum ErrorType {
  // Authentication errors
  InvalidCredentials = 'INVALID_CREDENTIALS',
  InvalidToken = 'INVALID_TOKEN',
  AccessTokenExpired = 'ACCESS_TOKEN_EXPIRED',
  RefreshTokenExpired = 'REFRESH_TOKEN_EXPIRED',

  // Generic HTTP errors
  BadRequest = 'BAD_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  UnprocessableEntity = 'UNPROCESSABLE_ENTITY',
  InternalServerError = 'INTERNAL_SERVER_ERROR',
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',

  // Unexpected
  UnexpectedError = 'UNEXPECTED_ERROR',
}
