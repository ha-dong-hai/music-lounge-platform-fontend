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
        // AuthResultDto KHÔNG có avatarUrl. Trước đây mỗi lần đăng nhập/làm mới phiên là user bị thay mới và mất ảnh
        // đại diện → góc phải luôn hiện hình mặc định (02/10/2026). Làm mới phiên của CÙNG người thì giữ ảnh cũ;
        // còn lại để undefined = "chưa biết" — Header tự lấy /me/profile một lần (null = đã hỏi, không có ảnh).
        const cu = get().user
        set({
          user: {
            ...mapAuthResultToUser(authResult),
            avatarUrl: cu && cu.id === authResult.userId ? cu.avatarUrl : undefined,
          },
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
