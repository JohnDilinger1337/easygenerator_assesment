import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenManager } from "@/lib/tokenManager";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Auth-Mode": "cookie",
  },
  timeout: 30000,
});

let isRefreshing = false;
let refreshSubscribers: ((error?: Error) => void)[] = [];

function onRefreshComplete(error?: Error) {
  refreshSubscribers.forEach((callback) => callback(error));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (error?: Error) => void) {
  refreshSubscribers.push(callback);
}

apiClient.interceptors.response.use(
  (response) => response.data.payload,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Don't retry auth endpoints
      const isAuthEndpoint =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/me");

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((refreshError?: Error) => {
            if (refreshError) {
              reject(refreshError);
            } else {
              resolve(apiClient(originalRequest));
            }
          });
        });
      }

      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh");
        onRefreshComplete();
        return apiClient(originalRequest);
      } catch (refreshError) {
        onRefreshComplete(refreshError as Error);
        tokenManager.clear();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
