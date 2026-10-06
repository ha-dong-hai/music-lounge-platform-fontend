import api from '../config/axios';

export const bankAccountService = {
  getAll: (params) => api.get('/api/v1/bank-accounts', { params }).then(res => res.data),
  create: (data) => api.post('/api/v1/bank-accounts', data).then(res => res.data),
  getDetail: (id) => api.get(`/api/v1/bank-accounts/${id}`).then(res => res.data),
  update: (id, data) => api.put(`/api/v1/bank-accounts/${id}`, data).then(res => res.data),
};
