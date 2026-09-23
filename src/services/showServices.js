import axiosClient from '../config/axios';

export const getShows = async (params = {}) => {
  return axiosClient.get('/lounge-shows', { params });
};

export const getShowDetail = async (id) => {
  return axiosClient.get(`/lounge-shows/${id}`);
};

export const searchShows = async (params = {}) => {
  return axiosClient.get('/lounge-shows/search', { params });
};

export const getFilterOptions = async () => {
  return axiosClient.get('/lounge-shows/filter-options');
};

export const getTrendingShows = async (params = {}) => {
  return axiosClient.get('/lounge-shows/trending', { params });
};

export const getDistricts = async (city) => {
  return axiosClient.get('/lounge-shows/filter-options/districts', { params: { city } });
};

export const getRecommendedShows = async (params = {}) => {
  return axiosClient.get('/recommendations', { params });
};

// Danh sách hạng vé (kèm mức giá) của 1 show — mỗi tier có prices[]: {id, name, price, quota,...}
export const getTicketTiers = async (showId) => {
  return axiosClient.get('/ticket-tiers', { params: { showId } });
};

// Chấm sao 1-5 + nhận xét sau khi show kết thúc — chỉ mở trong 7 ngày, 409 nếu đã đánh giá rồi.
export const rateShow = async (id, { score, comment }) => {
  return axiosClient.post(`/lounge-shows/${id}/rate`, { score, comment });
};

// ===== CÔNG KHAI =====
// Gợi ý tìm kiếm theo từ khoá đang gõ (autocomplete).
export const getShowSuggestions = async (q, limit = 8) => {
  return axiosClient.get('/lounge-shows/suggestions', { params: { q, limit } });
};

export const getShowsByLounge = async (loungeId, params = {}) => {
  return axiosClient.get(`/lounge-shows/by-lounge/${loungeId}`, { params });
};

export const getShowsByPerformer = async (performerId, params = {}) => {
  return axiosClient.get(`/lounge-shows/by-performer/${performerId}`, { params });
};

// Sơ đồ chỗ của buổi diễn — khu vực kèm vị trí 2D đã đặt ở màn Khu vực chỗ ngồi.
export const getShowSeatingMap = async (showId) => {
  return axiosClient.get(`/lounge-shows/${showId}/seating-map`);
};

export const getSimilarShows = async (id) => {
  return axiosClient.get(`/lounge-shows/${id}/similar`);
};

export const getShowRatings = async (showId, params = {}) => {
  return axiosClient.get(`/lounge-shows/${showId}/ratings`, { params });
};