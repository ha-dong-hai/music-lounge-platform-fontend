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

// MLACP-523: tạo / sửa hồ sơ phòng trà (chủ phòng trà). PUT ghi đè TOÀN BỘ — gửi đủ mọi trường, kể cả trường không sửa.
export const createLounge = async (payload) => {
  return axiosClient.post('/lounges', payload);
};

export const updateLounge = async (loungeId, payload) => {
  return axiosClient.put(`/lounges/${loungeId}`, payload);
};

export const getLoungeTour = async (loungeId) => {
  return axiosClient.get(`/lounges/${loungeId}/tour`);
};