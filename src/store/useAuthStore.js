import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      
      user: null,
      accessToken: null,
      expiresAtUtc: null,
      isAuthenticated: false,

      
      setAuth: (data) => {
        const { accessToken, expiresAtUtc, ...userProfile } = data;
        set({
          user: userProfile,
          accessToken,
          expiresAtUtc,
          isAuthenticated: true,
        });
      },

      setUser: (userData) => {
        set({ user: userData });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          expiresAtUtc: null,
          isAuthenticated: false,
        });
      },

      
      isTokenExpired: () => {
        const { expiresAtUtc } = get();
        if (!expiresAtUtc) return true;
        return new Date(expiresAtUtc) < new Date();
      },
    }),
    {
      name: 'auth-storage', 
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        expiresAtUtc: state.expiresAtUtc,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);