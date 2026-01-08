import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  ThrottleAuth,
  ThrottleRegister,
  ThrottleRefresh,
} from '../decorators/throttle.decorator';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from '../dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@/common/logging/logger.service';
import { InvalidTokenException } from '@/common/exceptions';
import { CurrentUserDto } from '../dto/current-user.dto';

type AuthMode = 'cookie' | 'body';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthController');
  }

  @Public()
  @ThrottleRegister()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: RegisterResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    const user = await this.authService.register(registerDto);
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      message: 'Registration successful',
    };
  }

  @Public()
  @ThrottleAuth()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Supports both cookie-based and token-based authentication. Use X-Auth-Mode header to specify mode (cookie or body).',
  })
  @ApiHeader({
    name: 'X-Auth-Mode',
    description: 'Authentication mode: "cookie" or "body"',
    required: false,
    schema: { type: 'string', enum: ['cookie', 'body'] },
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const tokens = await this.authService.login(loginDto);
    const authMode = this.getAuthMode(req);

    this.logger.log(
      `Login successful for ${loginDto.email} in ${authMode} mode`,
    );

    if (authMode === 'cookie') {
      this.setCookies(res, tokens);

      return {
        expiresIn: tokens.accessTokenExpiresIn,
        tokenType: 'Bearer',
        mode: 'cookie',
      };
    }

    // Return full tokens for body mode
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
      tokenType: 'Bearer',
      mode: 'body',
    };
  }

  @Public()
  @ThrottleRefresh()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Supports both cookie-based and token-based authentication. Use X-Auth-Mode header to specify mode.',
  })
  @ApiHeader({
    name: 'X-Auth-Mode',
    description: 'Authentication mode: "cookie" or "body"',
    required: false,
    schema: { type: 'string', enum: ['cookie', 'body'] },
  })
  @ApiResponse({ status: 200, type: RefreshTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() refreshTokenDto?: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    const authMode = this.getAuthMode(req);

    const refreshToken =
      authMode === 'cookie'
        ? req.cookies?.['refreshToken']
        : refreshTokenDto?.refreshToken;

    if (!refreshToken) {
      this.logger.warn(`Refresh token missing in ${authMode} mode`);
      throw new InvalidTokenException();
    }

    const tokens = await this.authService.refreshToken({ refreshToken });

    this.logger.log(`Token refreshed successfully in ${authMode} mode`);

    if (authMode === 'cookie') {
      this.setCookies(res, tokens);

      return {
        expiresIn: tokens.accessTokenExpiresIn,
        tokenType: 'Bearer',
        mode: 'cookie',
      };
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
      tokenType: 'Bearer',
      mode: 'body',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and revoke refresh tokens' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: CurrentUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = req.cookies?.['refreshToken'];

    await this.authService.logout(user.id, refreshToken);

    this.clearCookies(res);

    this.logger.log(`User ${user.email} logged out successfully`);

    return { message: 'Logout successful' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    type: CurrentUserDto,
    description: 'Current user information',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(
    @CurrentUser() user: CurrentUserDto,
  ): Promise<CurrentUserDto> {
    return this.authService.getCurrentUser(user.id);
  }

  /**
   * Set both access and refresh tokens in httpOnly cookies
   */
  private setCookies(
    res: Response,
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresIn: number;
      refreshTokenExpiresIn: number;
    },
  ): void {
    const secureCookie = this.isProduction();

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'strict',
      path: '/',
      maxAge: tokens.accessTokenExpiresIn * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'strict',
      path: '/auth',
      maxAge: tokens.refreshTokenExpiresIn * 1000,
    });

    this.logger.debug('Cookies set successfully');
  }

  /**
   * Clear authentication cookies
   */
  private clearCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/auth' });
    this.logger.debug('Cookies cleared');
  }

  /**
   * Determine authentication mode from header or environment
   * Priority: X-Auth-Mode header > AUTH_MODE env variable > default to 'cookie'
   */
  private getAuthMode(req: Request): AuthMode {
    const headerMode = req.headers['x-auth-mode'] as string | undefined;

    if (headerMode === 'cookie' || headerMode === 'body') {
      return headerMode;
    }

    if (headerMode) {
      this.logger.warn(
        `Invalid X-Auth-Mode header: "${headerMode}". Falling back to default.`,
      );
    }

    const envMode = this.configService.get<string>('AUTH_MODE', 'cookie');
    return envMode === 'body' ? 'body' : 'cookie';
  }

  /**
   * Check if running in production environment
   */
  private isProduction(): boolean {
    const authConfig = this.configService.get<any>('auth');

    if (authConfig?.security?.secureCookie !== undefined) {
      return authConfig.security.secureCookie;
    }

    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    return nodeEnv === 'production';
  }
}
