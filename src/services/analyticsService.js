import axiosInstance from '../config/axios';

export const analyticsService = {
  getOwnerAnalytics: async (loungeId) => {
    const response = await axiosInstance.get('/api/v1/analytics/my-lounge', {
      params: { loungeId }
    });
    return response.data;
  },

  getPlatformAnalytics: async () => {
    const response = await axiosInstance.get('/api/v1/analytics/platform');
    return response.data;
  }
};
