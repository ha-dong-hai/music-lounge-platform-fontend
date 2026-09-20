import axiosClient from '../config/axios';

// Nghệ sĩ do CHỦ PHÒNG TRÀ tạo và quản lý (khác với tìm kiếm nghệ sĩ công khai ở catalogServices).
// Nghệ sĩ là đối tượng nhận donate, nên mỗi nghệ sĩ có thể có tài khoản nhận tiền riêng
// (xem bankAccountServices với ownerType = 'Performer').
export const getMyPerformers = async (params = {}) => {
  return axiosClient.get('/performers', { params });
};

export const getPerformerDetail = async (id) => {
  return axiosClient.get(`/performers/${id}`);
};

// contactEmail không bắt buộc, nhưng có thì backend gửi được liên kết để nghệ sĩ TỰ XÁC NHẬN
// tham gia (luồng performer-confirmations). Không có email thì không ai xác nhận được.
export const createPerformer = async ({ name, avatarUrl = null, bio = null, type, genreIds = [], contactEmail = null }) => {
  return axiosClient.post('/performers', { name, avatarUrl, bio, type, genreIds, contactEmail });
};

// PUT ghi đè — gửi lại đầy đủ những gì đang hiển thị, đừng gửi từng phần.
export const updatePerformer = async (id, payload) => {
  return axiosClient.put(`/performers/${id}`, payload);
};

// Liên kết mạng xã hội thêm từng cái một; sửa thì xoá rồi thêm lại (backend không có endpoint sửa).
export const addPerformerSocialLink = async (id, payload) => {
  return axiosClient.put(`/performers/${id}/social-links`, payload);
};

export const removePerformerSocialLink = async (id, linkId) => {
  return axiosClient.delete(`/performers/${id}/social-links/${linkId}`);
};
