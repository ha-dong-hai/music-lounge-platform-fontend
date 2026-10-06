import api from '../config/axios';

export const complaintService = {
  // Audience: file a complaint
  create: (data) => api.post('/api/v1/complaints', data).then(res => res.data),
  // Get complaint detail
  getDetail: (id) => api.get(`/api/v1/complaints/${id}`).then(res => res.data),
  // My complaints
  getMyComplaints: (params) => api.get('/api/v1/complaints/my', { params }).then(res => res.data),
  // Lookup (public)
  lookup: (params) => api.get('/api/v1/complaints/lookup', { params }).then(res => res.data),
};
