import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,

      setAuth: (data) => {
        set({
          user: {
            userId: data.id || data.userId,
            email: data.email,
            fullName: data.fullName,
            role: data.role,
            loungeId: data.loungeId || null,
            avatarUrl: data.avatarUrl || null,
          },
          token: data.accessToken || data.token,
          expiresAt: data.expiresAtUtc || data.expiresAt,
          isAuthenticated: true,
        });
      },

      // Alias for setAuth (used by LoginPage)
      login: (data) => {
        get().setAuth(data);
      },

      setUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      logout: () => {
        set({
          user: null,
          token: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return new Date(expiresAt) < new Date();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);