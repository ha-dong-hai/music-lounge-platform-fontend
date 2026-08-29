import axiosInstance from '../config/axios';

export const showService = {
  getPublished: async ({ page = 1, pageSize = 10, sortBy = 'Newest', includeSoldOut = true } = {}) => {
    const response = await axiosInstance.get('/api/v1/lounge-shows', {
      params: { page, pageSize, sortBy, includeSoldOut },
    });
    return response.data;
  },

  getTrending: async ({ limit = 10, city = null } = {}) => {
    const response = await axiosInstance.get('/api/v1/lounge-shows/trending', {
      params: { limit, city },
    });
    return response.data;
  },

  getDetail: async (id) => {
    const response = await axiosInstance.get(`/api/v1/lounge-shows/${id}`);
    return response.data;
  },

  getSeatingMap: async (id) => {
    const response = await axiosInstance.get(`/api/v1/lounge-shows/${id}/seating-map`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosInstance.post('/api/v1/lounge-shows', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosInstance.put(`/api/v1/lounge-shows/${id}`, data);
    return response.data;
  },

  publish: async (id) => {
    const response = await axiosInstance.post(`/api/v1/lounge-shows/${id}/publish`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await axiosInstance.post(`/api/v1/lounge-shows/${id}/cancel`);
    return response.data;
  },

  reschedule: async (id, newScheduledStart) => {
    const response = await axiosInstance.post(`/api/v1/lounge-shows/${id}/reschedule`, { newScheduledStart });
    return response.data;
  },

  setCoverImage: async (id, imageUrl) => {
    const response = await axiosInstance.put(`/api/v1/lounge-shows/${id}/cover-image`, { imageUrl });
    return response.data;
  },

  getOrders: async (id, params) => {
    const response = await axiosInstance.get(`/api/v1/lounge-shows/${id}/orders`, { params });
    return response.data;
  },

  start: async (id) => {
    const response = await axiosInstance.post(`/api/v1/lounge-shows/${id}/start`);
    return response.data;
  },

  end: async (id) => {
    const response = await axiosInstance.post(`/api/v1/lounge-shows/${id}/end`);
    return response.data;
  },

  changeFormat: async (id, newFormat) => {
    const response = await axiosInstance.put(`/api/v1/lounge-shows/${id}/format`, { newFormat });
    return response.data;
  },

  setPlaybackMode: async (id, playbackMode) => {
    const response = await axiosInstance.put(`/api/v1/lounge-shows/${id}/playback-mode`, { playbackMode });
    return response.data;
  },

  setLegalApproval: async (id, ref) => {
    const response = await axiosInstance.put(`/api/v1/lounge-shows/${id}/legal-approval`, { legalApprovalReference: ref });
    return response.data;
  },

  setVcpmcRoyalty: async (id, ref) => {
    const response = await axiosInstance.put(`/api/v1/lounge-shows/${id}/vcpmc-royalty`, { vcpmcRoyaltyReference: ref });
    return response.data;
  },

  search: async (params = {}) => {
    const response = await axiosInstance.get('/api/v1/lounge-shows/search', { params });
    return response.data;
  },

  getSuggestions: async (q, limit = 8) => {
    const response = await axiosInstance.get('/api/v1/lounge-shows/suggestions', {
      params: { q, limit },
    });
    return response.data;
  },

  getFilterOptions: async () => {
    const response = await axiosInstance.get('/api/v1/lounge-shows/filter-options');
    return response.data;
  },

  getByLounge: async (loungeId, { page = 1, pageSize = 10 } = {}) => {
    const response = await axiosInstance.get(`/api/v1/lounge-shows/by-lounge/${loungeId}`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  getTicketTiers: async (showId) => {
    const response = await axiosInstance.get('/api/v1/ticket-tiers', {
      params: { showId },
    });
    return response.data;
  },

  rateShow: async (showId, { score, comment }) => {
    const response = await axiosInstance.post(`/api/v1/lounge-shows/${showId}/rate`, {
      score,
      comment,
    });
    return response.data;
  },

  deleteShow: async (id) => {
    const response = await axiosInstance.delete(`/api/v1/lounge-shows/${id}`);
    return response.data;
  },

  setPoster: async (id, imageUrl) => {
    const response = await axiosInstance.put(`/api/v1/lounge-shows/${id}/poster`, { imageUrl });
    return response.data;
  },

  generateAiPoster: async (id, styleHint) => {
    const response = await axiosInstance.post(`/api/v1/lounge-shows/${id}/ai-poster`, { styleHint });
    return response.data;
  },

  getAiPosterHistory: async (id) => {
    const response = await axiosInstance.get(`/api/v1/lounge-shows/${id}/ai-poster/history`);
    return response.data;
  },

  getByPerformer: async (performerId, params) => {
    const response = await axiosInstance.get(`/api/v1/lounge-shows/by-performer/${performerId}`, { params });
    return response.data;
  },

  getDistrictFilterOptions: async () => {
    const response = await axiosInstance.get('/api/v1/lounge-shows/filter-options/districts');
    return response.data;
  },
};
