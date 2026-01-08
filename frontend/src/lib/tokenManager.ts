/**
 * Minimal token manager for cookie-based auth
 * Only tracks expiry times, not the actual tokens (stored in httpOnly cookies)
 */

interface TokenExpiry {
  accessTokenExpiresAt: number;
}

const STORAGE_KEY = "__auth_expiry__";

class TokenManager {
  private expiry: TokenExpiry | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Set access token expiry time
   */
  setAccessTokenExpiry(expiresIn: number): void {
    this.expiry = {
      accessTokenExpiresAt: Date.now() + expiresIn * 1000,
    };
    this.saveToStorage();
  }

  /**
   * Check if access token is likely expired
   * (actual validation happens server-side)
   */
  isAccessTokenExpired(): boolean {
    if (!this.expiry) return true;
    // Add 30 second buffer to refresh before actual expiry
    return Date.now() >= this.expiry.accessTokenExpiresAt - 30000;
  }

  /**
   * Get time until token expires (in ms)
   */
  getTimeUntilExpiry(): number {
    if (!this.expiry) return 0;
    return Math.max(0, this.expiry.accessTokenExpiresAt - Date.now());
  }

  /**
   * Clear expiry data
   */
  clear(): void {
    this.expiry = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear expiry from localStorage:", e);
    }
  }

  private saveToStorage(): void {
    if (!this.expiry) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expiry));
    } catch (e) {
      console.warn("Failed to save expiry to localStorage:", e);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.expiry = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load expiry from localStorage:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const tokenManager = new TokenManager();
