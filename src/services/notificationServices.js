import axiosClient from '../config/axios';

// Thông báo trong ứng dụng của chính người đang đăng nhập (phân trang).
// Mỗi item: {id, type, title, body, referenceType, referenceId, isRead, createdAt}
export const getMyNotifications = async (params = {}) => {
  return axiosClient.get('/notifications', { params });
};

// Tách riêng khỏi danh sách để badge trên chuông không phải tải cả trang chỉ để lấy 1 con số.
export const getUnreadCount = async () => {
  return axiosClient.get('/notifications/unread-count');
};

export const markNotificationRead = async (id) => {
  return axiosClient.post(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  return axiosClient.post('/notifications/read-all');
};
