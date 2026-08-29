import api from '../config/axios';

export const livestreamService = {
  getDetail: (id) => api.get(`/api/v1/livestreams/${id}`).then(res => res.data),
  create: (showId) => api.post('/api/v1/livestreams', { showId }).then(res => res.data),
  start: (id) => api.post(`/api/v1/livestreams/${id}/start`).then(res => res.data),
  end: (id) => api.post(`/api/v1/livestreams/${id}/end`).then(res => res.data),
  getCredentials: (id) => api.get(`/api/v1/livestreams/${id}/credentials`).then(res => res.data),
  getChatHistory: (id, page = 1, pageSize = 50) =>
    api.get(`/api/v1/livestreams/${id}/chat`, { params: { page, pageSize } }).then(res => res.data),
  // Admin: terminate a livestream
  terminate: (id, reason) =>
    api.post(`/api/v1/livestreams/${id}/terminate`, { reason }).then(res => res.data),
};
