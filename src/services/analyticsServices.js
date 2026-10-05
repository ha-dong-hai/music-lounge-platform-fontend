import axiosClient from '../config/axios';

// Admin — tổng quan toàn nền tảng, MỌI THỜI GIAN
export const getPlatformAnalytics = async () => {
  return axiosClient.get('/analytics/platform');
};

// Admin — tổng quan THEO KỲ (mặc định tháng hiện tại, giờ VN). 
export const getAdminOverview = async (params = {}) => {
  return axiosClient.get('/analytics/admin-overview', { params });
};

export const getRecommenderEvaluation = async (k = 10) => {
  return axiosClient.get('/analytics/recommender-evaluation', { params: { k } });
};

// Admin — 4 khối của Dashboard (MLACP-463): doanh thu 6 tháng tách theo nguồn, top buổi diễn,
// months luôn là 6 tháng gần nhất bất kể from/to. limit mặc định 10, tối đa 50.
export const getAdminDashboard = async (params = {}) => {
  return axiosClient.get('/analytics/admin-dashboard', { params });
};

export const getTicketSalesTrend = async (showId) => {
  return axiosClient.get(`/analytics/shows/${showId}/ticket-sales-trend`);
};

// ===== THỐNG KÊ NÂNG CAO PHÍA CHỦ =====

// Xuất báo cáo doanh thu ra FILE (trả nhị phân, không phải JSON) — phải xin blob.
export const exportRevenueReport = async (loungeId, params = {}) => {
  return axiosClient.get('/analytics/revenue-report/export', {
    params: { loungeId, ...params }, responseType: 'blob',
  });
};

// Dự báo nhu cầu của một buổi diễn — đây là DỰ ĐOÁN, không phải số đã bán. Hiện nó cạnh số
// thật thì phải ghi nhãn rõ, kểo chủ phòng tra tưởng đã bán được nhiêu đó.
export const getShowDemandForecast = async (showId) => {
  return axiosClient.get(`/analytics/shows/${showId}/demand-forecast`);
};

// Tiền donate theo từng nghệ sĩ — tiền THU HỘ, không phải doanh thu của phòng trà.
// params: { from, to } tuỳ chọn (MLACP-659) — lọc theo lúc VNPay xác nhận tiền ủng hộ.
export const getArtistDonationStats = async (loungeId, params = {}) => {
  return axiosClient.get('/analytics/artist-donations', { params: { loungeId, ...params } });
};

export const getOwnerLivestreamHistory = async (loungeId, params = {}) => {
  return axiosClient.get('/analytics/livestream-history', { params: { loungeId, ...params } });
};

// ===== THỐNG KÊ PHÍA ADMIN =====
// Nội dung & giám sát: số buổi diễn chờ duyệt, khiếu nại chưa xử lý, vi phạm trong tháng,
// và xếp hạng phòng trà theo điểm uy tín.
export const getAdminContentOverview = async () => {
  return axiosClient.get('/analytics/admin-content-overview');
};

// Tương tác khán giả trong kỳ: follow mới, wishlist mới, đánh giá mới, và tỷ lệ khán giả mua vé
// từ 2 buổi diễn khác nhau trở lên ("tỷ lệ quay lại").
export const getAudienceEngagement = async (params = {}) => {
  return axiosClient.get('/analytics/audience-engagement', { params });
};

export const getAiRecommendationPerformance = async (params = {}) => {
  return axiosClient.get('/analytics/ai-recommendation-performance', { params });
};

// ===== PHÍA OWNER =====
// LƯU Ý: các endpoint Owner đều BẮT BUỘC có loungeId trên query string (MLACP-449 / PR #317 KHÔNG bỏ
// tham số này). Từ #317, token của chủ phòng trà có claim lounge_id và kết quả login/refresh có
// loungeId — nhưng chủ tạo phòng trà SAU khi đã đăng nhập thì token hiện tại chưa có, tới lần refresh.
// Vì vậy GET /lounges?mine=true vẫn là đường dự phòng cần giữ (backend xác nhận không bỏ nó).
// params: { from, to } tuỳ chọn (MLACP-659) — lọc theo lúc mua vé / lúc gọi món; bỏ trống = mọi thời gian.
export const getMyLoungeAnalytics = async (loungeId, params = {}) => {
  return axiosClient.get('/analytics/my-lounge', { params: { loungeId, ...params } });
};

// Báo cáo doanh thu gộp: vé + F&B + donate, tách theo buổi diễn và theo tháng.
// Chú ý phân biệt 3 con số dễ nhầm:
//   grandTotal                        = doanh thu GỘP phát sinh trong kỳ
//   totalSettlementReceived           = tiền THẬT SỰ đã về tài khoản ngân hàng (giải ngân sau show)
//   totalDonationCollectedForPerformers = tiền thu hộ nghệ sĩ, KHÔNG phải doanh thu, không cộng vào grandTotal
export const getRevenueReport = async (loungeId, params = {}) => {
  return axiosClient.get('/analytics/revenue-report', { params: { loungeId, ...params } });
};

export const getShowPerformance = async (showId) => {
  return axiosClient.get(`/analytics/shows/${showId}/performance`);
};
