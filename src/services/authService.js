import axiosInstance from '../config/axios';

export const authService = {
  register: async ({ email, password, fullName, phone, role = 'Audience' }) => {
    const response = await axiosInstance.post('/api/v1/auth/register', {
      email,
      password,
      fullName,
      phone: phone || null,
      acceptTerms: true,
      role,
    });
    return response.data;
  },

  verifyEmail: async ({ email, code }) => {
    const response = await axiosInstance.post('/api/v1/auth/verify-email', {
      email,
      code,
    });
    return response.data;
  },

  resendVerificationCode: async ({ email }) => {
    const response = await axiosInstance.post('/api/v1/auth/resend-verification-code', {
      email,
    });
    return response.data;
  },

  login: async ({ email, password }) => {
    const response = await axiosInstance.post('/api/v1/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  googleLogin: async ({ idToken }) => {
    const response = await axiosInstance.post('/api/v1/auth/google', {
      idToken,
    });
    return response.data;
  },

  forgotPassword: async ({ email }) => {
    const response = await axiosInstance.post('/api/v1/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  resetPassword: async ({ email, code, newPassword }) => {
    const response = await axiosInstance.post('/api/v1/auth/reset-password', {
      email,
      code,
      newPassword,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/api/v1/me');
    return response.data;
  },

  updateProfile: async ({ fullName, phone, avatarUrl, dateOfBirth }) => {
    const response = await axiosInstance.put('/api/v1/me/profile', {
      fullName,
      phone: phone || null,
      avatarUrl: avatarUrl || null,
      dateOfBirth: dateOfBirth || null,
    });
    return response.data;
  },

  updatePreferences: async ({ genreIds, moodIds, atmosphereIds, enableAiConsent }) => {
    const response = await axiosInstance.put('/api/v1/me/preferences', {
      genreIds: genreIds || [],
      moodIds: moodIds || [],
      atmosphereIds: atmosphereIds || [],
      enableAiConsent: enableAiConsent || false,
    });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await axiosInstance.delete('/api/v1/me');
    return response.data;
  },

  // Citizen card
  submitCitizenCard: async ({ citizenCardNumber, frontImageUrl, backImageUrl }) => {
    const response = await axiosInstance.post('/api/v1/me/citizen-card', {
      citizenCardNumber, frontImageUrl, backImageUrl,
    });
    return response.data;
  },
  getCitizenCard: async (side) => {
    const response = await axiosInstance.get(`/api/v1/me/citizen-card/${side}`);
    return response.data;
  },

  // Earnings (owner)
  getEarnings: async () => {
    const response = await axiosInstance.get('/api/v1/me/earnings');
    return response.data;
  },

  // Data export & erasure (GDPR)
  exportData: async () => {
    const response = await axiosInstance.get('/api/v1/me/data-export');
    return response.data;
  },
  requestDataErasure: async (currentPassword) => {
    const response = await axiosInstance.post('/api/v1/me/data-erasure', { currentPassword });
    return response.data;
  },

  // Phone verification
  sendPhoneCode: async () => {
    const response = await axiosInstance.post('/api/v1/me/phone/verification-code');
    return response.data;
  },
  verifyPhone: async (code) => {
    const response = await axiosInstance.post('/api/v1/me/phone/verify', { code });
    return response.data;
  },
};
