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
