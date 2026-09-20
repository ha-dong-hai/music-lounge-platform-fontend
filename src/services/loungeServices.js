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

// ===== NHÂN VIÊN PHÒNG TRÀ =====
// Nhân viên là TÀI KHOẢN ĐÃ CÓ trên hệ thống được chủ gán vào phòng trà — không phải tạo tài khoản mới.
// Quy tắc của backend: MỖI TÀI KHOẢN chỉ làm nhân viên ở ĐÚNG MỘT phòng trà đang hoạt động tại một
// thời điểm. Gán một người đang làm ở phòng trà khác sẽ bị từ chối — hiện nguyên câu backend trả về,
// vì "email này đang làm chỗ khác" và "lỗi hệ thống" là hai chuyện khác nhau với người đang thao tác.
export const getLoungeStaff = async (loungeId) => {
  return axiosClient.get(`/lounges/${loungeId}/staff`);
};

// Tra cứu người dùng theo email để mời làm nhân viên. Cố tình CHỬ trả vai trò: endpoint này không
// phải công cụ tra thông tin người khác. 404 nếu email không có tài khoản.
export const lookupUserByEmail = async (email) => {
  return axiosClient.get('/lounges/staff/lookup', { params: { email } });
};

export const assignStaff = async (loungeId, userId) => {
  return axiosClient.post(`/lounges/${loungeId}/staff`, { userId });
};

// Gọi là "deactivate": bản ghi được giữ lại kèm mốc thời gian, không xóa lịch sử đã từng làm việc.
export const deactivateStaff = async (loungeId, staffId) => {
  return axiosClient.delete(`/lounges/${loungeId}/staff/${staffId}`);
};
