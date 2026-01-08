export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Authentication App';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  APPLICATION: '/application',
} as const;
