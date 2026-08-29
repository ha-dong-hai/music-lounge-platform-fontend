import api from '../config/axios';

export const notificationService = {
  getAll: (params) => api.get('/api/v1/notifications', { params }).then(res => res.data),
  markAsRead: (id) => api.post(`/api/v1/notifications/${id}/read`).then(res => res.data),
  markAllRead: () => api.post('/api/v1/notifications/read-all').then(res => res.data),
  registerDeviceToken: (fid) =>
    api.post('/api/v1/notifications/device-tokens', { fid }).then(res => res.data),
  removeDeviceToken: (fid) =>
    api.delete('/api/v1/notifications/device-tokens', { data: { fid } }).then(res => res.data),
};
