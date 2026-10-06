import api from '../config/axios';

export const ticketTierService = {
  getByShow: (showId) => api.get('/api/v1/ticket-tiers', { params: { showId } }).then(res => res.data),
  create: (data) => api.post('/api/v1/ticket-tiers', data).then(res => res.data),
  update: (id, data) => api.put(`/api/v1/ticket-tiers/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/v1/ticket-tiers/${id}`).then(res => res.data),
};
