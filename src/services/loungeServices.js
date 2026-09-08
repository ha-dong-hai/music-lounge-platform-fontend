import axiosClient from '../config/axios';

export const getLoungeDetail = async (id) => {
  return axiosClient.get(`/lounges/${id}`);
};

export const getLoungeZones = async (loungeId, activeOnly = true) => {
  return axiosClient.get(`/lounges/${loungeId}/zones`, { params: { activeOnly } });
};

export const getLounges = async (params = {}) => {
  return axiosClient.get('/lounges', { params });
};