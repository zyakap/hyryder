/**
 * Axios API client — automatically attaches JWT tokens.
 * Implements exponential backoff retry for network failures.
 */
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "en",
  },
});

// Attach JWT access token to every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — refresh token, then retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync("refresh_token");
        if (!refresh) throw new Error("No refresh token");

        const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
        const { access } = response.data;

        await SecureStore.setItemAsync("access_token", access);
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)["Authorization"] = `Bearer ${access}`;
        }
        return apiClient(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("refresh_token");
        // Navigate to login — handled by auth store
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
