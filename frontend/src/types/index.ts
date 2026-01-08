export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  expiresIn: number;
}

export interface RefreshTokenResponse {
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  message: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  path?: string;
  method?: string;
  timestamp?: string;
}
