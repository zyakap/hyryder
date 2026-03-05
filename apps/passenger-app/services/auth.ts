/**Auth service — OTP send/verify, logout."""
import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "@hyryder/shared-types";
import apiClient from "./api";

export const authService = {
  sendOTP: async (phone_number: string): Promise<void> => {
    await apiClient.post("/auth/otp/send/", { phone_number, role: "passenger" });
  },

  verifyOTP: async (phone_number: string, otp_code: string): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>("/auth/otp/verify/", {
      phone_number,
      otp_code,
      role: "passenger",
    });
    const { access, refresh } = response.data;
    await SecureStore.setItemAsync("access_token", access);
    await SecureStore.setItemAsync("refresh_token", refresh);
    return response.data;
  },

  logout: async (refresh: string): Promise<void> => {
    await apiClient.post("/auth/logout/", { refresh });
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
  },
};
