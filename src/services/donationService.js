import api from '../config/axios';

export const donationService = {
  // Create donation (returns VNPay URL)
  donate: (livestreamId, amount, message) =>
    api.post('/api/v1/donations', { livestreamId, amount, message }).then(res => res.data),

  // Get donation detail
  getDetail: (id) => api.get(`/api/v1/donations/${id}`).then(res => res.data),

  // Public donations list
  getPublicDonations: (params) =>
    api.get('/api/v1/donations/public', { params }).then(res => res.data),

  // My donations
  getMyDonations: (params) =>
    api.get('/api/v1/donations/my', { params }).then(res => res.data),

  // Pending acknowledgement (for owner)
  getPendingAck: (params) =>
    api.get('/api/v1/donations/pending-ack', { params }).then(res => res.data),

  // Awaiting payout (for owner)
  getAwaitingPayout: (params) =>
    api.get('/api/v1/donations/awaiting-payout', { params }).then(res => res.data),

  // Acknowledge a donation (owner)
  acknowledge: (id) =>
    api.post(`/api/v1/donations/${id}/acknowledge`).then(res => res.data),

  // Confirm paid (owner)
  confirmPaid: (id) =>
    api.post(`/api/v1/donations/${id}/confirm-paid`).then(res => res.data),

  // Get donations for a performer
  getByPerformer: (performerId, params) =>
    api.get(`/api/v1/performers/${performerId}/donations`, { params }).then(res => res.data),
};
