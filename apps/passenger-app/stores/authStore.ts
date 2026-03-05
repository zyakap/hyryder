/**
 * Zustand auth store — persists tokens, manages authenticated user state.
 */
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User } from "@hyryder/shared-types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),

  initialize: async () => {
    const token = await SecureStore.getItemAsync("access_token");
    if (token) {
      set({ isAuthenticated: true });
      // Optionally fetch /api/v1/users/me/ here
    }
    set({ isLoading: false });
  },

  logout: async () => {
    const refresh = await SecureStore.getItemAsync("refresh_token");
    if (refresh) {
      try {
        const { authService } = await import("../services/auth");
        await authService.logout(refresh);
      } catch {
        // Ignore errors on logout
      }
    }
    set({ user: null, isAuthenticated: false });
  },
}));
