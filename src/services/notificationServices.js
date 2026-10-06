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

// ===== THÔNG BÁO ĐẨY TRÊN THIẾT BỊ =====
// `token` là mã thiết bị do Firebase Messaging cấp, KHÔNG phải token đăng nhập.
// Mỗi trình duyệt / thiết bị một mã riêng; đăng xuất thì nên gọi unregister để thiết bị đó
// không nhận thông báo của người khác nữa.
// Lưu ý: DELETE có BODY — axios cần truyền qua { data }, không phải tham số thứ hai như POST.
export const registerDevice = async (token, platform) => {
  return axiosClient.post('/notifications/devices', { token, platform });
};

export const unregisterDevice = async (token) => {
  return axiosClient.delete('/notifications/devices', { data: { token } });
};
