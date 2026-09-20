import axiosClient from '../config/axios';

// Báo cáo 1 nội dung ĐANG hiển thị là vi phạm (khác cổng kiểm duyệt AI trước khi đăng).
// targetType nhận đúng 4 giá trị: 'Show' | 'Livestream' | 'Rating' | 'ChatMessage'.
// 'ChatMessage' (MLACP-456): targetId là mã tin nhắn trong lịch sử chat; tin nhắn không tồn tại → 404.
// reason tối đa 500 ký tự (FluentValidation sẽ trả 400 nếu vượt).
// 409 nếu chính bạn đã báo cáo nội dung đó và báo cáo cũ vẫn đang chờ Admin xử lý.
export const submitContentReport = async ({ targetType, targetId, reason }) => {
  return axiosClient.post('/content-reports', { targetType, targetId, reason });
};

// Admin — hàng đợi nội dung bị báo cáo, nội dung bị báo cáo nhiều nhất lên đầu, kèm hạn SLA gỡ bỏ.
export const getContentReportQueue = async (params = {}) => {
  return axiosClient.get('/content-reports/queue', { params });
};

// Admin — xử lý toàn bộ báo cáo đang mở của 1 nội dung.
// action: 'Removed' (gỡ nội dung, hiệu lực ngay) hoặc 'Dismissed' (bỏ qua, giữ nguyên). note tối đa 1000 ký tự.
export const resolveContentReport = async ({ targetType, targetId, action, note = null }) => {
  return axiosClient.post('/content-reports/resolve', { targetType, targetId, action, note });
};
