import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Refresh token request DTO
 * Supports both cookie mode (no body required) and token mode (token in body)
 */
export class RefreshTokenDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Refresh token for token mode (optional if using HttpOnly cookies)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

/**
 * Refresh token response DTO - Conditional response based on auth mode
 * - Cookie mode: tokens are empty (sent in HttpOnly cookies)
 * - Token mode: tokens are included in response body
 */
export class RefreshTokenResponseDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'New access token (empty in cookie mode, populated in token mode)',
  })
  accessToken?: string;

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'New refresh token (empty in cookie mode, populated in token mode)',
  })
  refreshToken?: string;

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Token expiration time in seconds (optional if using HttpOnly cookies)',
  })
  @IsOptional()
  expiresIn?: number;

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Refresh token expiration time in seconds (optional if using HttpOnly cookies)',
  })
  @IsOptional()
  refreshTokenExpiresIn?: number;

  @ApiProperty({ default: 'Bearer' })
  tokenType: string;

  @ApiPropertyOptional({
    description: 'The authentication mode used (cookie or body/header)',
  })
  mode?: 'cookie' | 'body';
}
