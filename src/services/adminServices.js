import axiosClient from '../config/axios';

export const getAdminStats = async () => {
  const [all, audience, owner, staff, banned] = await Promise.all([
    axiosClient.get('/admin/users', { params: { pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Audience', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Owner', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Staff', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { isActive: false, pageSize: 1 } }),
  ]);
  return {
    total: all.data.totalCount,
    users: audience.data.totalCount,
    owners: owner.data.totalCount,
    staff: staff.data.totalCount,
    banned: banned.data.totalCount,
  };
};

export const getAdminUsers = async (params = {}) => {
  return axiosClient.get('/admin/users', { params });
};

export const getAdminUserDetail = async (id) => {
  return axiosClient.get(`/admin/users/${id}`);
};

export const toggleUserBan = async (id, isActive) => {
  if (isActive) {
    return axiosClient.post(`/admin/users/${id}/deactivate`);
  }
  return axiosClient.post(`/admin/users/${id}/reactivate`);
};

export const getPendingModerations = async (params = {}) => {
  return axiosClient.get('/moderations/pending', { params });
};

export const reviewShowModeration = async (showId, decision, reviewNote = '') => {
  if (decision !== 'Approved' && decision !== 'Rejected') {
    return Promise.reject(new Error('decision chỉ nhận "Approved" hoặc "Rejected"'));
  }
  return axiosClient.post(`/moderations/shows/${showId}/review`, {
    decision,
    reviewNote,
  });
};

// Hàng đợi khiếu nại cho Admin. Đường cũ '/admin/complaints' KHÔNG TỎN TẠI trên backend
// (đã gọi thật: 404) — đúng là '/complaints/pending'.
// Lưu ý phạm vi: endpoint này CHỈ trả khiếu nại status Open + Investigating, sắp xếp id
// giảm dần. Backend chưa có đường nào xem khiếu nại ĐÃ xử lý, nên đừng trông đợi
// Resolved/Rejected xuất hiện ở đây.
// Tham số: page (mặc định 1), pageSize (mặc định 10, backend kẹp 1..50).
export const getAdminComplaints = async (params = {}) => {
  return axiosClient.get('/complaints/pending', { params });
};

// Lịch sử khiếu nại cho Admin — MỌI trạng thái, không chỉ hàng đợi đang mở (MLACP-462).
// status: mảng, gửi lặp kiểu ?status=Resolved&status=Rejected (paramsSerializer trong axios.js lo sẵn).
//   Bỏ trống = mọi trạng thái. Tên sai → 422, message liệt kê các giá trị hợp lệ.
// pageSize mặc định 20 (KHÁC /complaints/pending mặc định 10). Item cùng ComplaintDto với /pending.
// Mỗi lần gọi backend GHI LOG kèm mã Admin + bộ lọc, vì dữ liệu gồm mô tả và số điện thoại
// người khiếu nại (kể cả khách không đăng nhập) — đừng gọi nền / gọi thừa.
export const getComplaintHistory = async (params = {}) => {
  return axiosClient.get('/admin/complaints', { params });
};

export const reviewLivestreamModeration = async (livestreamId, decision, reviewNote = '') => {
  if (decision !== 'Approved' && decision !== 'Rejected') {
    return Promise.reject(new Error('decision chỉ nhận "Approved" hoặc "Rejected"'));
  }
  return axiosClient.post(`/moderations/livestreams/${livestreamId}/review`, {
    decision,
    reviewNote,
  });
};