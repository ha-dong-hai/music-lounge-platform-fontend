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

export const getAdminVenues = async (params = {}) => {
  return axiosClient.get('/admin/venues/pending', { params });
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

// ===== DANH MỤC LỌC (thể loại nhạc / tâm trạng / không gian) — Admin CRUD =====
// typeKey trùng đoạn đường dẫn của backend, nhưng vẫn qua danh sách cho phép: không ghép thẳng
// chuỗi gọi từ giao diện vào URL.
// PUT và DELETE trả 204 không body — interceptor trong config/axios.js quy về { success: true, data: null }.
// 409 khi trùng tên, hoặc khi xoá mục đang được buổi diễn sử dụng; message của backend nói rõ lý do.
const FILTER_OPTION_SEGMENTS = { genres: 'genres', moods: 'moods', atmospheres: 'atmospheres' };

const filterOptionPath = (typeKey) => {
  const segment = FILTER_OPTION_SEGMENTS[typeKey];
  if (!segment) throw new Error(`Loại danh mục lọc không hợp lệ: ${typeKey}`);
  return `/admin/${segment}`;
};

// Chỉ thể loại nhạc có nameEn (CreateMusicGenreCommand). Mô tả tâm trạng / không gian chỉ nhận name,
// gửi thêm trường là gửi thứ backend không đọc.
const filterOptionBody = (typeKey, data) => (
  typeKey === 'genres'
    ? { name: data.name, nameEn: data.nameEn || null }
    : { name: data.name }
);

export const createFilterOption = async (typeKey, data) => {
  return axiosClient.post(filterOptionPath(typeKey), filterOptionBody(typeKey, data));
};

export const updateFilterOption = async (typeKey, id, data) => {
  return axiosClient.put(`${filterOptionPath(typeKey)}/${id}`, filterOptionBody(typeKey, data));
};

export const deleteFilterOption = async (typeKey, id) => {
  return axiosClient.delete(`${filterOptionPath(typeKey)}/${id}`);
};
