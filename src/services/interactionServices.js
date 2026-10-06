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

// ===== TẮT THÔNG BÁO TỪ PHÒNG TRÀ =====
// Tắt thông báo KHÁC với bỏ theo dõi: vẫn theo dõi để phòng trà còn trong danh sách của mình,
// nhưng không nhận thông báo mỗi lần họ đăng buổi diễn mới.
export const getMutedLounges = async () => {
  return axiosClient.get('/mutes/lounges');
};

export const muteLounge = async (loungeId) => {
  return axiosClient.post(`/mutes/lounges/${loungeId}`);
};

export const unmuteLounge = async (loungeId) => {
  return axiosClient.delete(`/mutes/lounges/${loungeId}`);
};
