import axiosClient from '../config/axios';

// Trang nghệ sĩ mở từ liên kết trong email (MLACP-364). Nghệ sĩ KHÔNG có tài khoản trên hệ thống,
// nên không đăng nhập: token trong liên kết là thứ cho phép đúng một hành động.
//
// ⚠ TOKEN ĐI TRONG BODY, KHÔNG ĐI TRONG ĐƯỜNG DẪN — cả hai endpoint đều là POST vì lý do đó:
// đường dẫn request bị ghi vào log, và một token nằm trong log là một liên kết mà ai đọc được log
// cũng dùng được. Đừng "tối ưu" lookup thành GET với token trên query string.

// Nghệ sĩ đang được hỏi xác nhận điều gì. State:
//   Open     — còn dùng được
//   Used     — đã trả lời rồi (liên kết dùng một lần)
//   Expired  — quá thời hạn
//   Outdated — tài khoản nhận tiền đã bị sửa SAU khi gửi liên kết, nên nội dung không còn đúng
export const lookupPerformerConfirmation = async (token) => {
  return axiosClient.post('/performer-confirmations/lookup', { token });
};

// decision: 'Confirm' (đúng / đã nhận) hoặc 'Dispute' (không phải của tôi / chưa nhận).
// consentToDataProcessing BẮT BUỘC phải true — đồng ý cho xử lý email và thông tin tài khoản
// theo Luật Bảo vệ dữ liệu cá nhân 2025. note tối đa 500 ký tự.
export const respondToPerformerConfirmation = async ({ token, decision, consentToDataProcessing, note = null }) => {
  return axiosClient.post('/performer-confirmations/respond', { token, decision, consentToDataProcessing, note });
};
