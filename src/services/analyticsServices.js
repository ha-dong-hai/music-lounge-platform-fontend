import axiosClient from '../config/axios';

// Admin — tổng quan toàn nền tảng, MỌI THỜI GIAN (khác adminOverview vốn lọc theo kỳ).
// {totalVenues, totalPublishedShows, totalUsers, totalTicketsSold, totalGrossMerchandiseValue,
//  totalDonationVolume, pendingModerationsCount, operatingVenues, venuesByStatus}
// totalVenues đếm MỌI trạng thái (kể cả chờ duyệt, bị từ chối, bị khoá) — KHÔNG phải số đang hoạt động.
// Số đang hoạt động là operatingVenues (Approved + Warned, MLACP-452), cùng định nghĩa với
// activeVenuesCount của admin-overview. venuesByStatus: { Pending, Approved, Warned, Suspended, Locked,
// Rejected } → số lượng, dùng để giải thích chênh lệch giữa hai con số trên.
export const getPlatformAnalytics = async () => {
  return axiosClient.get('/analytics/platform');
};

// Admin — tổng quan THEO KỲ (mặc định tháng hiện tại, giờ VN). Truyền from/to để xem kỳ khác.
// {periodFrom, periodTo, activeVenuesCount, eventsInPeriodCount, platformRevenueInPeriod,
//  newAudienceSignupsInPeriod}
export const getAdminOverview = async (params = {}) => {
  return axiosClient.get('/analytics/admin-overview', { params });
};

// Admin — đo chất lượng mô hình gợi ý bằng leave-one-out HR@K, luôn kèm baseline để so sánh.
// Chưa đủ người dùng có lịch sử thì trả status='NotEnoughHistory' và KHÔNG có con số nào —
// phải tôn trọng trạng thái đó, đừng hiển thị 0% như thể đã đo được.
export const getRecommenderEvaluation = async (k = 10) => {
  return axiosClient.get('/analytics/recommender-evaluation', { params: { k } });
};

// Admin — 4 khối của Dashboard (MLACP-463): doanh thu 6 tháng tách theo nguồn, top buổi diễn,
// thể loại. Hợp đồng chi tiết + những bẫy khi vẽ: xem đầu components/admin/dashboard/DashboardCharts.jsx.
// params: { from, to, limit } — from/to CHỈ áp cho topShows + genres (bỏ trống = 6 tháng gần nhất);
// months luôn là 6 tháng gần nhất bất kể from/to. limit mặc định 10, tối đa 50.
export const getAdminDashboard = async (params = {}) => {
  return axiosClient.get('/analytics/admin-dashboard', { params });
};

// ===== PHÍA OWNER =====
// LƯU Ý: các endpoint Owner đều BẮT BUỘC có loungeId trên query string (MLACP-449 / PR #317 KHÔNG bỏ
// tham số này). Từ #317, token của chủ phòng trà có claim lounge_id và kết quả login/refresh có
// loungeId — nhưng chủ tạo phòng trà SAU khi đã đăng nhập thì token hiện tại chưa có, tới lần refresh.
// Vì vậy GET /lounges?mine=true vẫn là đường dự phòng cần giữ (backend xác nhận không bỏ nó).
export const getMyLoungeAnalytics = async (loungeId) => {
  return axiosClient.get('/analytics/my-lounge', { params: { loungeId } });
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

export const getTicketSalesTrend = async (showId) => {
  return axiosClient.get(`/analytics/shows/${showId}/ticket-sales-trend`);
};
