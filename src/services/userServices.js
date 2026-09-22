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
// enableAiConsent là sự đồng ý cho hệ thống dùng lịch sử xem/mua để gợi ý. Tắt thì chỉ gợi ý theo
// sở thích khai tay. PUT ghi đè toàn bộ — gửi lại đủ cả 3 mảng, bỏ trống là xoá hết lựa chọn cũ.
export const updatePreferences = async ({ genreIds, moodIds, atmosphereIds, enableAiConsent, dislikedGenreIds = [] }) => {
  return axiosClient.put('/me/preferences', { genreIds, moodIds, atmosphereIds, enableAiConsent, dislikedGenreIds });
};

// ===== ĐỊNH DANH (CCCD) =====
// Ảnh CCCD là giấy tờ tùy thân: tải lên /uploads/images trước rồi gửi URL. Backend chuyển sang vùng
// lưu RIÊNG TƯ, nên ẢNH KHÔNG MỞ TRỰC TIẾP ĐƯỢC — muốn xem lại phải gọi getMyCitizenCardImage.
export const submitCitizenCard = async ({ citizenCardNumber, frontImageUrl, backImageUrl, dateOfBirth = null }) => {
  return axiosClient.post('/me/citizen-card', { citizenCardNumber, frontImageUrl, backImageUrl, dateOfBirth });
};

// side: 'front' | 'back'. Trả về FILE nhị phân, không phải JSON.
export const getMyCitizenCardImage = async (side) => {
  return axiosClient.get(`/me/citizen-card/${side}`, { responseType: 'blob' });
};

// ===== HỒ SƠ THUẾ =====
// CHỈ áp cho hộ / cá nhân kinh doanh (GTGT 5% + TNCN 2%), KHÔNG áp cho người dùng thường —
// đừng hiện form này cho mọi tài khoản.
export const getMyTaxProfile = async () => {
  return axiosClient.get('/me/tax-profile');
};

export const submitTaxProfile = async ({ businessType, taxCode, legalName = null }) => {
  return axiosClient.put('/me/tax-profile', { businessType, taxCode, legalName });
};

// ===== XÁC THỰC SỐ ĐIỆN THOẠI =====
// Gửi mã tới số điện thoại đang khai trong hồ sơ — không nhận số khác, muốn đổi số thì sửa hồ sơ trước.
export const requestPhoneVerificationCode = async () => {
  return axiosClient.post('/me/phone/verification-code');
};

export const verifyPhone = async (code) => {
  return axiosClient.post('/me/phone/verify', { code });
};

// ===== DỮ LIỆU CÁ NHÂN =====
// Tải về toàn bộ dữ liệu cá nhân (quyền truy cập dữ liệu).
export const getMyDataExport = async () => {
  return axiosClient.get('/me/data-export');
};

// VÔ HIỆU HOÁ tài khoản — khác với xoá dữ liệu. Đăng nhập lại được hay không tùy backend quyết định.
export const deactivateMyAccount = async () => {
  return axiosClient.delete('/me');
};

// YÊU CẦU XOÁ DỮ LIỆU — không hoàn tác được. Có thể cần mật khẩu hiện tại để xác minh danh tính.
export const requestDataErasure = async (currentPassword = null) => {
  return axiosClient.post('/me/data-erasure', { currentPassword });
};

// ===== TIỀN (chủ phòng trà) =====
export const getMyTransactions = async (params = {}) => {
  return axiosClient.get('/me/transactions', { params });
};

export const getMyEarnings = async () => {
  return axiosClient.get('/me/earnings');
};

// Tải mô hình 3D (.glb/.gltf) — riêng một endpoint khác ảnh, và chỉ chủ phòng trà dùng được.
export const uploadModel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosClient.post('/uploads/models', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
