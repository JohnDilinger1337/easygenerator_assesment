import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh-token.schema';
import { PasswordService } from './password.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
  TokenPayload,
  TokenPair,
  TokenValidationResult,
} from '../types/token.types';
import * as crypto from 'crypto';
import { LoggerService } from '../../../common/logging/logger.service';
import {
  InvalidCredentialsException,
  InvalidTokenException,
  RefreshTokenExpiredException,
} from '../../../common/exceptions';
import { CurrentUserDto } from '../dto/current-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Register a new user
   * @throws ConflictException if email already exists
   */
  async register(registerDto: RegisterDto): Promise<UserDocument> {
    const { email, password, name } = registerDto;

    this.logger.log(`Registration attempt for email: ${email}`);

    const existingUser = await this.userModel.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      this.logger.warn(`Registration failed: Email ${email} already exists`);
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await this.passwordService.hash(password);

    const user = new this.userModel({
      email: email.toLowerCase(),
      name,
      password: passwordHash,
    });

    const savedUser = await user.save();

    this.logger.log(`User registered successfully: ${savedUser.email}`);

    return savedUser;
  }

  /**
   * Login user and generate token pair
   * @returns Full token pair (service always returns complete tokens)
   * @throws InvalidCredentialsException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<TokenPair> {
    const { email, password } = loginDto;

    this.logger.log(`Login attempt for email: ${email}`);

    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${email}`);
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await this.passwordService.verify(
      user.password,
      password,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${email}`);
      throw new InvalidCredentialsException();
    }

    const tokens = await this.generateTokenPair(user);

    this.logger.log(`Login successful: ${user.email}`);

    return tokens;
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation - old token is revoked, new pair is generated
   * @returns New token pair
   * @throws InvalidTokenException if token is invalid
   * @throws RefreshTokenExpiredException if token is expired
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
    const { refreshToken } = refreshTokenDto;

    this.logger.log('Token refresh attempt');

    if (!refreshToken) {
      throw new InvalidTokenException();
    }

    const validation = await this.validateRefreshToken(refreshToken);

    if (!validation.valid || !validation.payload) {
      if (validation.error === 'Token expired') {
        this.logger.warn('Token refresh failed: Token expired');
        throw new RefreshTokenExpiredException();
      }
      this.logger.warn(`Token refresh failed: ${validation.error}`);
      throw new InvalidTokenException();
    }

    const user = await this.userModel.findById(validation.payload.sub);

    if (!user) {
      this.logger.warn('Token refresh failed: User not found');
      throw new InvalidTokenException();
    }

    const hashedToken = this.hashToken(refreshToken);
    const revokeResult = await this.refreshTokenModel.updateOne(
      { token: hashedToken, userId: user._id, revoked: false },
      { revoked: true, revokedAt: new Date() },
    );

    if (revokeResult.matchedCount === 0) {
      this.logger.warn('Token refresh failed: Token already used or revoked');
      await this.revokeAllUserTokens(user._id.toString());
      throw new InvalidTokenException();
    }

    const tokens = await this.generateTokenPair(user);

    this.logger.log(`Token refreshed successfully: ${user.email}`);

    return tokens;
  }

  /**
   * Logout user by revoking refresh tokens
   * If refreshToken is provided, only that token is revoked
   * Otherwise, all user's tokens are revoked
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    this.logger.log(`Logout attempt for user: ${userId}`);

    if (refreshToken) {
      const hashedToken = this.hashToken(refreshToken);
      await this.refreshTokenModel.updateOne(
        { token: hashedToken, userId },
        { revoked: true, revokedAt: new Date() },
      );
      this.logger.log(`Specific token revoked for user: ${userId}`);
    } else {
      await this.revokeAllUserTokens(userId);
      this.logger.log(`All tokens revoked for user: ${userId}`);
    }
  }

  /**
   * Get current user information by ID
   * @throws InvalidTokenException if user not found
   */
  async getCurrentUser(userId: string): Promise<CurrentUserDto> {
    const user = await this.userModel.findById(userId).select('-password');

    if (!user) {
      this.logger.warn(`Get current user failed: User not found - ${userId}`);
      throw new InvalidTokenException();
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
  }

  /**
   * Generate complete token pair (access + refresh)
   * Stores hashed refresh token in database
   */
  private async generateTokenPair(user: UserDocument): Promise<TokenPair> {
    const payload: TokenPayload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessTokenExpiresIn = this.getAccessTokenExpiry();
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshTokenSecret = this.getRefreshTokenSecret();
    const refreshTokenExpiresIn = this.getRefreshTokenExpiry();

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
    });

    const hashedToken = this.hashToken(refreshToken);
    await this.refreshTokenModel.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + refreshTokenExpiresIn * 1000),
      revoked: false,
    });

    await this.cleanupExpiredTokens(user._id);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  /**
   * Validate refresh token without throwing
   * Checks JWT signature, expiration, and database record
   */
  private async validateRefreshToken(
    token: string,
  ): Promise<TokenValidationResult> {
    try {
      const refreshTokenSecret = this.getRefreshTokenSecret();
      const payload = this.jwtService.verify(token, {
        secret: refreshTokenSecret,
      }) as TokenPayload;

      const hashedToken = this.hashToken(token);
      const tokenDoc = await this.refreshTokenModel.findOne({
        token: hashedToken,
        userId: payload.sub,
        revoked: false,
      });

      if (!tokenDoc) {
        return { valid: false, error: 'Token not found or revoked' };
      }

      if (tokenDoc.expiresAt < new Date()) {
        await this.refreshTokenModel.updateOne(
          { _id: tokenDoc._id },
          { revoked: true, revokedAt: new Date() },
        );
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid token';
      this.logger.error(`Token validation error: ${errorMessage}`);
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * Used during logout or security incidents
   */
  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { userId, revoked: false },
      { revoked: true, revokedAt: new Date() },
    );
  }

  /**
   * Hash token using SHA-256
   * Never store plain tokens in database
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Clean up expired refresh tokens older than 30 days
   * Called after generating new tokens
   */
  private async cleanupExpiredTokens(userId: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.refreshTokenModel.deleteMany({
      userId,
      expiresAt: { $lt: thirtyDaysAgo },
    });

    if (result.deletedCount > 0) {
      this.logger.debug(
        `Cleaned up ${result.deletedCount} expired tokens for user ${userId}`,
      );
    }
  }

  /**
   * Get access token expiry in seconds
   */
  private getAccessTokenExpiry(): number {
    const expiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') ||
      this.configService.get<string>('auth.jwt.expiresIn') ||
      '15m';

    return this.parseExpiresIn(expiresIn);
  }

  /**
   * Get refresh token expiry in seconds
   */
  private getRefreshTokenExpiry(): number {
    const expiresIn =
      this.configService.get<string | number>('JWT_REFRESH_EXPIRES_IN') ??
      this.configService.get<string | number>('auth.jwt.refreshExpiresIn') ??
      '7d';

    return this.parseExpiresIn(expiresIn);
  }

  /**
   * Get refresh token secret
   */
  private getRefreshTokenSecret(): string {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('auth.jwt.refreshSecret');

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    return secret;
  }

  /**
   * Parse expiration time to seconds
   * Supports: '15m', '7d', '1h', '30s', or raw seconds (number)
   */
  private parseExpiresIn(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      this.logger.warn(
        `Invalid expiresIn format: ${expiresIn}. Using default 15m`,
      );
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 60);
  }
}
