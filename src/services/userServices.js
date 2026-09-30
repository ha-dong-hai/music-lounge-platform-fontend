import axiosClient from '../config/axios';

export const getMyProfile = async () => {
  return axiosClient.get('/me');
};

export const updateProfile = async (payload) => {
  return axiosClient.put('/me/profile/', payload);
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosClient.post('/uploads/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ===== SỚ THÍCH GỢI Ý =====
export const updatePreferences = async ({ genreIds, moodIds, atmosphereIds, enableAiConsent, dislikedGenreIds = [] }) => {
  return axiosClient.put('/me/preferences', { genreIds, moodIds, atmosphereIds, enableAiConsent, dislikedGenreIds });
};

// ===== ĐỊNH DANH (CCCD) =====
export const submitCitizenCard = async ({ citizenCardNumber, frontImageUrl, backImageUrl, dateOfBirth = null }) => {
  return axiosClient.post('/me/citizen-card', { citizenCardNumber, frontImageUrl, backImageUrl, dateOfBirth });
};

// side: 'front' | 'back'. Trả về FILE nhị phân, không phải JSON.
export const getMyCitizenCardImage = async (side) => {
  return axiosClient.get(`/me/citizen-card/${side}`, { responseType: 'blob' });
};

// ===== HỒ SƠ THUẾ =====

export const getMyTaxProfile = async () => {
  return axiosClient.get('/me/tax-profile');
};

export const submitTaxProfile = async ({ businessType, taxCode, legalName = null }) => {
  return axiosClient.put('/me/tax-profile', { businessType, taxCode, legalName });
};

// ===== XÁC THỰC SỐ ĐIỆN THOẠI =====

export const requestPhoneVerificationCode = async () => {
  return axiosClient.post('/me/phone/verification-code');
};

export const verifyPhone = async (code) => {
  return axiosClient.post('/me/phone/verify', { code });
};

// ===== DỮ LIỆU CÁ NHÂN =====

export const getMyDataExport = async () => {
  return axiosClient.get('/me/data-export');
};

export const deactivateMyAccount = async () => {
  return axiosClient.delete('/me');
};

export const requestDataErasure = async (currentPassword = null) => {
  return axiosClient.post('/me/data-erasure', { currentPassword });
};