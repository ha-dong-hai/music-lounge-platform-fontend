import axiosInstance from '../config/axios';

export const wishlistService = {
  getMyWishlist: async ({ page = 1, pageSize = 10 } = {}) => {
    const response = await axiosInstance.get('/api/v1/wishlist', {
      params: { page, pageSize },
    });
    return response.data;
  },

  addToWishlist: async (showId) => {
    const response = await axiosInstance.post(`/api/v1/wishlist/${showId}`);
    return response.data;
  },

  removeFromWishlist: async (showId) => {
    const response = await axiosInstance.delete(`/api/v1/wishlist/${showId}`);
    return response.data;
  },
};
