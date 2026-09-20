import axiosClient from '../config/axios';

// role mặc định "Audience" khớp RegisterCommand backend (self-registration chỉ nhận Audience/Owner)
export const register = async ({ email, password, fullName, phone, acceptTerms, role = 'Audience' }) => {
  return axiosClient.post('/auth/register', { email, password, fullName, phone, acceptTerms, role });
};

export const verifyEmail = async ({ email, code }) => {
  return axiosClient.post('/auth/verify-email', { email, code });
};

export const resendVerificationCode = async (email) => {
  return axiosClient.post('/auth/resend-verification-code', { email });
};

export const login = async (email, password) => {
  return axiosClient.post('/auth/login', { email, password });
};

export const googleLogin = async (idToken, acceptTerms = false) => {
  return axiosClient.post('/auth/google', { idToken, acceptTerms });
};

export const forgotPassword = async (email) => {
  return axiosClient.post('/auth/forgot-password', { email });
};

export const resetPassword = async ({ token, newPassword }) => {
  return axiosClient.post('/auth/reset-password', { token, newPassword });
};

export const logout = async () => {
  return axiosClient.post('/auth/logout');
};
