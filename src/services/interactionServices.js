import axiosClient from '../config/axios';

// WISHLIST
export const getWishlist = async (params = {}) => {
  return axiosClient.get('/wishlist', { params });
};

export const toggleWishlist = async (id, isCurrentlyWishlisted) => {
  if (isCurrentlyWishlisted) {
    return axiosClient.delete(`/wishlist/${id}`);
  }
  return axiosClient.post(`/wishlist/${id}`);
};

// FOLLOW LOUNGE
export const getFollowedLounges = async (params = {}) => {
  return axiosClient.get('/follows/lounges', { params });
};

export const toggleFollowLounge = async (loungeId, isCurrentlyFollowing) => {
  if (isCurrentlyFollowing) {
    return axiosClient.delete(`/follows/lounges/${loungeId}`);
  }
  return axiosClient.post(`/follows/lounges/${loungeId}`);
};