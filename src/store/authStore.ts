import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  login as loginApi,
  logout as logoutApi,
  refreshAccessToken as refreshTokenApi,
} from "../api/auth";
import type { AuthResponse, LoginPayload, User } from "../types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  isHydrated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokenAction: () => Promise<void>;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      isHydrated: false,

      login: async (payload) => {
        set({ loading: true });
        try {
          const data: AuthResponse = await loginApi(payload);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        const currentRefreshToken = get().refreshToken;

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          loading: false,
        });

        logoutApi(currentRefreshToken).catch(() => {});
      },

      refreshTokenAction: async () => {
        const currentRefreshToken = get().refreshToken;

        if (!currentRefreshToken) {
          get().logout();
          return;
        }

        try {
          const data = await refreshTokenApi(currentRefreshToken);
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
        } catch {
          set({ user: null, accessToken: null, refreshToken: null });
        }
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);