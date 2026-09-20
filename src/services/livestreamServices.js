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

// --- Owner/Staff vận hành (RequireVenueOperator ở backend) ---

export const createLivestream = async ({ showId, isFree = false, chatEnabled = true }) => {
  return axiosClient.post('/livestreams', { showId, isFree, chatEnabled });
};

// Nhạy cảm — RTMP URL + Stream Key để cắm phần mềm phát (OBS...), không hiển thị cho khán giả.
export const getLivestreamCredentials = async (id) => {
  return axiosClient.get(`/livestreams/${id}/credentials`);
};

export const startLivestream = async (id) => {
  return axiosClient.post(`/livestreams/${id}/start`);
};

export const endLivestream = async (id) => {
  return axiosClient.post(`/livestreams/${id}/end`);
};
