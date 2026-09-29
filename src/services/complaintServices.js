import axiosClient from '../config/axios';

// KHÁCH CHƯA ĐĂNG NHẬP GỬI ĐƯỢC — khi đó phải để lại số điện thoại liên hệ.
export const createComplaint = async ({ targetType, targetId, category, description, evidenceUrls = null, contactPhone = null }) => {
  return axiosClient.post('/complaints', { targetType, targetId, category, description, evidenceUrls, contactPhone });
};

// Tra cứu bằng mã nhận được lúc gửi — dành cho người không có tài khoản.
// Backend trả CÙNG MỘT thông báo cho mã sai và mã không tồn tại (cố tình, để không thành công cụ dò mã),
// nên đừng cố phân biệt hai trường hợp đó trên giao diện.
export const lookupComplaint = async (reference) => {
  return axiosClient.get(`/complaints/lookup/${encodeURIComponent(reference)}`);
};

export const getMyComplaints = async (params = {}) => {
  return axiosClient.get('/complaints/my', { params });
};

// Admin xử lý khiếu nại.
// status: 'Investigating' | 'Resolved' | 'Rejected'
// resolvedAction (chỉ khi Resolved): 'Refund' | 'IssueWarning' | 'Dismiss' | 'TakeDownContent'
// ⚠ HẬU QUẢ THẬT, đọc trước khi bấm:
//   Refund           = hoàn tiền vé của RIÊNG người khiếu nại, buổi diễn vẫn diễn ra
//   IssueWarning     = tạo án phạt cảnh cáo cho phòng trà
//   TakeDownContent  = HUỶ HẲN buổi diễn và hoàn 100% cho MỌI người đang giữ vé
//   Dismiss          = bỏ qua, không làm gì
export const resolveComplaint = async (id, { status, resolution = null, resolvedAction = null }) => {
  return axiosClient.post(`/complaints/${id}/resolve`, { status, resolution, resolvedAction });
};
