import axiosClient from '../config/axios';

export const getPackages = async (activeOnly = false) => {
  return axiosClient.get('/subscriptions/packages', { params: { activeOnly } });
};

export const createPackage = async (payload) => {
  return axiosClient.post('/subscriptions/packages', payload);
};

export const updatePackage = async (id, payload) => {
  return axiosClient.put(`/subscriptions/packages/${id}`, payload);
};

// ===== PHÍA OWNER =====
// Gói đang dùng của chính Owner đang đăng nhập. Trả null nếu chưa từng đăng ký gói nào.
export const getMySubscription = async () => {
  return axiosClient.get('/subscriptions/my');
};

// Cả 3 hàm dưới đều trả về {paymentId, orderId, amount, paymentUrl} — phải chuyển hướng trình duyệt
// sang paymentUrl (VNPay), giống hệt luồng mua vé và donate. Không có khoản nào bị trừ ngay tại đây.
export const subscribeToPackage = async (packageId) => {
  return axiosClient.post('/subscriptions/subscribe', { packageId });
};

// Gia hạn đúng gói đang dùng — không cần chọn lại từ danh sách.
export const renewSubscription = async () => {
  return axiosClient.post('/subscriptions/renew');
};

// Đổi sang gói khác, hiệu lực ngay. Phần còn lại của gói cũ được quy thành thời gian ở gói mới
// (KHÔNG hoàn tiền mặt) — DTO trả thêm creditValue/creditDays/estimatedExpiresAt để hiển thị ước tính.
export const changePackage = async (packageId) => {
  return axiosClient.post('/subscriptions/change-package', { packageId });
};

// Huỷ = ngừng gia hạn. Gói vẫn dùng được tới hết kỳ đã trả tiền, không hoàn tiền.
export const cancelSubscription = async () => {
  return axiosClient.post('/subscriptions/cancel');
};