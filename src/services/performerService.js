import api from '../config/axios';

export const performerService = {
  getAll: (params) => api.get('/api/v1/performers', { params }).then(res => res.data),
  getDetail: (id) => api.get(`/api/v1/performers/${id}`).then(res => res.data),
  create: (data) => api.post('/api/v1/performers', data).then(res => res.data),
  // data: { name, avatarUrl, bio, type, genreIds }
  update: (id, data) => api.put(`/api/v1/performers/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/v1/performers/${id}`).then(res => res.data),
  
  // Social links
  updateSocialLinks: (id, data) =>
    api.put(`/api/v1/performers/${id}/social-links`, data).then(res => res.data),
  // data: { platform, url, displayName }
  deleteSocialLink: (id, linkId) =>
    api.delete(`/api/v1/performers/${id}/social-links/${linkId}`).then(res => res.data),

  // Donations for a performer
  getDonations: (performerId, params) =>
    api.get(`/api/v1/performers/${performerId}/donations`, { params }).then(res => res.data),
};
