import { useEffect, useRef } from "react";
import { authService } from "@/services/auth.service";
import { tokenManager } from "@/lib/tokenManager";

/**
 * Hook to automatically refresh access token before expiry
 */
export function useTokenRefresh(isAuthenticated: boolean) {
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const timeUntilExpiry = tokenManager.getTimeUntilExpiry();

      if (timeUntilExpiry <= 0) {
        return;
      }

      const refreshTime = Math.max(
        timeUntilExpiry - 2 * 60 * 1000,
        timeUntilExpiry / 2
      );

      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          await authService.refreshToken();
          scheduleRefresh();
        } catch (error) {
          console.error("Token refresh failed:", error);
          // Don't try to refresh again - let the API interceptor handle it
        }
      }, refreshTime);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [isAuthenticated]);
}
