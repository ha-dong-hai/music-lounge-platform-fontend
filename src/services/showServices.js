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

// MLACP-522: đã bỏ getDistricts — /lounge-shows/filter-options/districts chưa từng tồn tại ở backend (luôn 404) và cấp
// quận/huyện không còn từ 01/7/2025. Danh sách phường/xã theo tỉnh: getWardsOfProvince (catalogServices).