import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// authResult khớp AuthResultDto backend trả về từ /auth/login, /auth/register (sau verify-email),
// /auth/google, /auth/refresh: { token, expiresAt, userId, email, fullName, role, loungeId,
// refreshToken, refreshTokenExpiresAt }
const mapAuthResultToUser = (authResult) => ({
  id: authResult.userId,
  email: authResult.email,
  name: authResult.fullName,
  role: authResult.role,
  loungeId: authResult.loungeId ?? null,
});

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,

      login: (authResult) => {
        set({
          user: mapAuthResultToUser(authResult),
          token: authResult.token,
          refreshToken: authResult.refreshToken ?? null,
          expiresAt: authResult.expiresAt ?? null,
        });
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, expiresAt: null });
      },

      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return new Date(expiresAt).getTime() <= Date.now();
      },
    }),
    {
      name: 'musiclounge-auth', // key lưu trong localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
