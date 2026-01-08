import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Login request DTO
 */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email must be a valid email format' })
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

/**
 * Login response DTO - Conditional response based on auth mode
 * - Cookie mode: tokens are empty (sent in HttpOnly cookies)
 * - Token mode: tokens are included in response body
 */
export class LoginResponseDto {
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
