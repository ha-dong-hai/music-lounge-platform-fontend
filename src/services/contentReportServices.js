import axiosClient from '../config/axios';

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