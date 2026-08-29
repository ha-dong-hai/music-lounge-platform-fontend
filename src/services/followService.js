import api from '../config/axios';

export const followService = {
  // Get lounges I follow
  getMyFollows: (params) => api.get('/api/v1/follows/lounges', { params }).then(res => res.data),
  // Follow a lounge
  follow: (loungeId) => api.post(`/api/v1/follows/lounges/${loungeId}`).then(res => res.data),
  // Unfollow a lounge
  unfollow: (loungeId) => api.delete(`/api/v1/follows/lounges/${loungeId}`).then(res => res.data),
};
