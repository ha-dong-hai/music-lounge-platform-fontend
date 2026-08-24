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