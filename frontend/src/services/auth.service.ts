import apiClient from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { tokenManager } from "@/lib/tokenManager";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  User,
} from "@/types";

/**
 * Auth Service for cookie-based authentication
 * Tokens are stored in httpOnly cookies by the backend
 * Frontend only tracks expiry times for proactive refresh
 */
export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response.data;
  },

  /**
   * Login user
   * Cookies are set automatically by the server
   * Returns user data and stores expiry time
   */
  async login(data: LoginRequest): Promise<User> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );

    const { expiresIn } = response.data;

    tokenManager.setAccessTokenExpiry(expiresIn);

    const user = await this.getCurrentUser();

    return user;
  },

  /**
   * Refresh access token
   * Cookies are updated automatically by the server
   */
  async refreshToken(): Promise<void> {
    const response = await apiClient.post<RefreshTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH
    );

    tokenManager.setAccessTokenExpiry(response.data.expiresIn);
  },

  /**
   * Logout user
   * Clears cookies on server and local expiry data
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      tokenManager.clear();
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },
};
