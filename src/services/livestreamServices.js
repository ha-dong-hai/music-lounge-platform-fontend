import axiosClient from '../config/axios';

export const getLivestreamDetail = async (id) => {
  return axiosClient.get(`/livestreams/${id}`);
};

export const getChatHistory = async (id, params = {}) => {
  return axiosClient.get(`/livestreams/${id}/chat`, { params });
};

export const sendHeartbeat = async (id, sessionId) => {
  return axiosClient.post(`/livestreams/${id}/heartbeat`, { sessionId });
};

export const terminateLivestream = async (id, reason) => {
  return axiosClient.post(`/livestreams/${id}/terminate`, { reason });
};