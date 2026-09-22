import axiosClient from '../config/axios';

// Khiếu nại / báo cáo vi phạm (D17). Khác với "báo cáo nội dung" ở contentReportServices:
// đây là khiếu nại về một GIAO DỊCH hoặc một BÊN (buổi diễn, phòng trà, donate, vé, án phạt),
// vào hàng đợi Admin kèm hạn xử lý theo cấu hình hệ thống.

// KHÁCH CHƯA ĐĂNG NHẬP GỬI ĐƯỢC — khi đó phải để lại số điện thoại liên hệ.
// targetType: 'show' | 'venue' | 'donation' | 'ticket' | 'penalty' | 'livestream'
// ⚠ evidenceUrls là MỘT CHUỖI chứa mảng JSON (ví dụ '["https://a","https://b"]'), KHÔNG phải mảng.
//   Backend lưu nguyên chuỗi đó; gửi mảng thẳng sẽ không đúng kiểu.
// Trả về { id, lookupReference }. lookupReference là thứ DUY NHẤT để khách không có tài khoản tra
// lại kết quả về sau — PHẢI hiện cho họ ngay và nhắc họ lưu lại.
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
