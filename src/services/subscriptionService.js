import api from '../config/axios';

export const subscriptionService = {
  // Get available subscription packages
  getPackages: (activeOnly = true) =>
    api.get('/api/v1/subscriptions/packages', { params: { activeOnly } }).then(res => res.data),

  // Get current owner's subscription
  getMySubscription: () =>
    api.get('/api/v1/subscriptions/my').then(res => res.data),

  // Subscribe to a package (returns VNPay URL)
  subscribe: (packageId) =>
    api.post('/api/v1/subscriptions/subscribe', { packageId }).then(res => res.data),

  // Renew current subscription
  renew: () =>
    api.post('/api/v1/subscriptions/renew').then(res => res.data),

  // Cancel current subscription
  cancel: () =>
    api.post('/api/v1/subscriptions/cancel').then(res => res.data),
};
