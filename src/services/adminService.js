import api from '../config/axios';

export const adminService = {
  // ========== Users ==========
  getUsers: (params) => api.get('/api/v1/admin/users', { params }).then(res => res.data),
  getUserDetail: (id) => api.get(`/api/v1/admin/users/${id}`).then(res => res.data),
  getUserCitizenCard: (id, side) => api.get(`/api/v1/admin/users/${id}/citizen-card/${side}`, { responseType: 'blob' }).then(res => res.data),
  deactivateUser: (id) => api.post(`/api/v1/admin/users/${id}/deactivate`).then(res => res.data),
  reactivateUser: (id) => api.post(`/api/v1/admin/users/${id}/reactivate`).then(res => res.data),

  // ========== Shows (public endpoints, no /admin prefix) ==========
  getShows: (params) => api.get('/api/v1/lounge-shows', { params }).then(res => res.data),
  getShowDetail: (id) => api.get(`/api/v1/lounge-shows/${id}`).then(res => res.data),

  // ========== Show Moderation ==========
  reviewShow: (showId, { decision, reason }) =>
    api.post(`/api/v1/moderations/shows/${showId}/review`, { decision, reason }).then(res => res.data),
  // Convenience wrappers
  approveShow: (id) => api.post(`/api/v1/moderations/shows/${id}/review`, { decision: 'Approved' }).then(res => res.data),
  rejectShow: (id, reason) => api.post(`/api/v1/moderations/shows/${id}/review`, { decision: 'Rejected', reason }).then(res => res.data),
  getPendingModerations: () => api.get('/api/v1/moderations/pending').then(res => res.data),

  // ========== Subscription Packages (under /subscriptions, not /admin) ==========
  getPackages: (params) => api.get('/api/v1/subscriptions/packages', { params }).then(res => res.data),
  createPackage: (data) => api.post('/api/v1/subscriptions/packages', data).then(res => res.data),
  updatePackage: (id, data) => api.put(`/api/v1/subscriptions/packages/${id}`, data).then(res => res.data),

  // ========== Lounge Approval ==========
  getPendingLounges: () => api.get('/api/v1/admin/lounges/pending').then(res => res.data),
  approveLounge: (id) => api.post(`/api/v1/admin/lounges/${id}/approve`).then(res => res.data),
  rejectLounge: (id, reason) => api.post(`/api/v1/admin/lounges/${id}/reject`, { reason }).then(res => res.data),

  // ========== Bank Accounts ==========
  getPendingBankAccounts: () => api.get('/api/v1/admin/bank-accounts/pending').then(res => res.data),
  verifyBankAccount: (id, data) => api.post(`/api/v1/admin/bank-accounts/${id}/verify`, data).then(res => res.data),

  // ========== Refunds ==========
  getPendingRefunds: (params) => api.get('/api/v1/admin/refund-requests', { params }).then(res => res.data),
  createRefundRequest: (data) => api.post('/api/v1/admin/refund-requests', data).then(res => res.data),
  processRefund: (id, { decision, approvedAmount }) =>
    api.post(`/api/v1/admin/refund-requests/${id}/process`, { decision, approvedAmount }).then(res => res.data),

  // ========== Complaints ==========
  getComplaints: (params) => api.get('/api/v1/admin/complaints', { params }).then(res => res.data),
  resolveComplaint: (id, data) => api.post(`/api/v1/admin/complaints/${id}/resolve`, data).then(res => res.data),

  // ========== Categories / Genres / Moods / Atmospheres ==========
  createCategory: (data) => api.post('/api/v1/admin/categories', data).then(res => res.data),
  updateCategory: (id, data) => api.put(`/api/v1/admin/categories/${id}`, data).then(res => res.data),
  deleteCategory: (id) => api.delete(`/api/v1/admin/categories/${id}`).then(res => res.data),

  createGenre: (data) => api.post('/api/v1/admin/genres', data).then(res => res.data),
  updateGenre: (id, data) => api.put(`/api/v1/admin/genres/${id}`, data).then(res => res.data),
  deleteGenre: (id) => api.delete(`/api/v1/admin/genres/${id}`).then(res => res.data),

  createMood: (data) => api.post('/api/v1/admin/moods', data).then(res => res.data),
  updateMood: (id, data) => api.put(`/api/v1/admin/moods/${id}`, data).then(res => res.data),
  deleteMood: (id) => api.delete(`/api/v1/admin/moods/${id}`).then(res => res.data),

  createAtmosphere: (data) => api.post('/api/v1/admin/atmospheres', data).then(res => res.data),
  updateAtmosphere: (id, data) => api.put(`/api/v1/admin/atmospheres/${id}`, data).then(res => res.data),
  deleteAtmosphere: (id) => api.delete(`/api/v1/admin/atmospheres/${id}`).then(res => res.data),

  // ========== Ledger ==========
  // Note: getLedger endpoint may not exist in Swagger but is used by AdminLedgerPage
  getLedger: (params) => api.get('/api/v1/admin/ledger', { params }).then(res => res.data),
  checkLedgerIntegrity: () => api.get('/api/v1/admin/ledger/integrity-check').then(res => res.data),

  // ========== Analytics ==========
  getDashboardStats: () => api.get('/api/v1/analytics/platform').then(res => res.data),
  getOwnerAnalytics: () => api.get('/api/v1/analytics/my-lounge').then(res => res.data),

  // ========== Jobs ==========
  triggerJob: (jobId) => api.post(`/api/v1/admin/jobs/${jobId}/trigger`).then(res => res.data),
};
