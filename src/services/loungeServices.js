import axiosClient from '../config/axios';

export const getLoungeDetail = async (id) => {
  return axiosClient.get(`/lounges/${id}`);
};

export const getLoungeZones = async (loungeId, activeOnly = true) => {
  return axiosClient.get(`/lounges/${loungeId}/zones`, { params: { activeOnly } });
};

export const getLounges = async (params = {}) => {
  return axiosClient.get('/lounges', { params });
};

// ===== HỒ SƠ PHÒNG TRÀ (chủ phòng trà tự quản) =====
// LƯU Ý QUAN TRỌNG SAU KHI TẠO: token hiện tại của chủ CHƯA có claim lounge_id (nó được cấp lúc đăng
// nhập). Phải gọi refresh token ngay sau khi tạo phòng trà, nếu không các màn Owner khác sẽ không
// nhận ra chủ đã có phòng trà.
// Địa chỉ: Street + Ward + City là bắt buộc, District tùy chọn (cấp huyện đã bãi bỏ từ 01/07/2025 nên
// giao diện không hỏi nữa, chỉ gửi lại giá trị cũ nếu bản ghi đã có).
export const createLounge = async (payload) => {
  return axiosClient.post('/lounges', payload);
};

export const updateLounge = async (loungeId, payload) => {
  return axiosClient.put(`/lounges/${loungeId}`, payload);
};

// Ảnh đại diện và giấy phép đều nhận URL, không nhận file: tải file lên /uploads/images trước
// (xem uploadImage trong userServices) rồi gửi URL nhận được vào đây.
export const setLoungeImage = async (loungeId, imageUrl) => {
  return axiosClient.put(`/lounges/${loungeId}/image`, { imageUrl });
};

// Giấy phép kinh doanh là giấy tờ định danh doanh nghiệp: backend chuyển file sang vùng lưu RIÊNG TƯ
// ngay khi nhận, nên URL này KHÔNG mở trực tiếp được. Muốn xem phải gọi getLoungeBusinessLicense.
export const setLoungeBusinessLicense = async (loungeId, documentUrl) => {
  return axiosClient.put(`/lounges/${loungeId}/business-license`, { documentUrl });
};

// Trả về chính FILE (nhị phân), không phải JSON — nên phải xin blob và KHÔNG đi qua interceptor
// bóc data như các lời gọi khác. Chỉ chủ phòng trà đó hoặc Admin xem được; Admin xem thì có ghi log.
export const getLoungeBusinessLicense = async (loungeId) => {
  return axiosClient.get(`/lounges/${loungeId}/business-license`, { responseType: 'blob' });
};
