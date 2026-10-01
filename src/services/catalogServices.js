import axiosClient from '../config/axios';

// Danh mục dùng chung cho các ô chọn khi tạo buổi diễn. Tất cả đều trả MẢNG TRẦN (không phân trang).
// Admin thêm/sửa/xoá các mục này qua /admin/genres, /admin/moods, /admin/atmospheres, /admin/event-categories.
export const getGenres = async () => axiosClient.get('/catalog/music-genres');
export const getMoods = async () => axiosClient.get('/catalog/moods');
export const getAtmospheres = async () => axiosClient.get('/catalog/venue-atmospheres');
export const getEventCategories = async () => axiosClient.get('/catalog/event-categories');

// MLACP-522: danh mục hành chính 2 cấp từ 01/7/2025 (34 tỉnh, 3.321 phường/xã — QĐ 19/2025/QĐ-TTg). Không còn cấp
// quận/huyện: chọn tỉnh rồi chọn phường/xã. Mỗi mục: { code, name, divisionType }.
export const getProvinces = async () => axiosClient.get('/catalog/provinces');
export const getWardsOfProvince = async (provinceCode) => axiosClient.get(`/catalog/provinces/${provinceCode}/wards`);

// Nghệ sĩ có sẵn hồ sơ, dùng cho ô chọn line-up. CÓ phân trang (khác các danh mục ở trên).
// Nghệ sĩ KHÔNG có tài khoản đăng nhập — hồ sơ do phòng trà quản lý.
export const searchPerformers = async (params = {}) => {
  return axiosClient.get('/performers', { params });
};
