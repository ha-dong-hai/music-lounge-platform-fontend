import axiosClient from '../config/axios';

export const getAdminStats = async () => {
  const [all, audience, owner, staff, banned] = await Promise.all([
    axiosClient.get('/admin/users', { params: { pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Audience', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Owner', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Staff', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { isActive: false, pageSize: 1 } }),
  ]);
  return {
    total: all.data.totalCount,
    users: audience.data.totalCount,
    owners: owner.data.totalCount,
    staff: staff.data.totalCount,
    banned: banned.data.totalCount,
  };
};

export const getAdminUsers = async (params = {}) => {
  return axiosClient.get('/admin/users', { params });
};

export const getAdminUserDetail = async (id) => {
  return axiosClient.get(`/admin/users/${id}`);
};

export const toggleUserBan = async (id, isActive) => {
  if (isActive) {
    return axiosClient.post(`/admin/users/${id}/deactivate`);
  }
  return axiosClient.post(`/admin/users/${id}/reactivate`);
};

export const getPendingModerations = async (params = {}) => {
  return axiosClient.get('/moderations/pending', { params });
};

// export const reviewShowModeration = async (showId, decision, reviewNote = '') => {
//   if (decision !== 'Approved' && decision !== 'Rejected') {
//     return Promise.reject(new Error('decision chỉ nhận "Approved" hoặc "Rejected"'));
//   }
//   return axiosClient.post(`/moderations/shows/${showId}/review`, {
//     decision,
//     reviewNote,
//   });
// };

export const getAdminComplaints = async (params = {}) => {
  return axiosClient.get('/admin/complaints', { params });
};

export const getAdminVenues = async (params = {}) => {
  return axiosClient.get('/admin/venues/pending', { params });
};

export const createFilterOption = async (type, payload) => {
  return axiosClient.post(`/admin/${type}`, payload);
};

export const updateFilterOption = async (type, id, payload) => {
  return axiosClient.put(`/admin/${type}/${id}`, payload);
};

export const deleteFilterOption = async (type, id) => {
  return axiosClient.delete(`/admin/${type}/${id}`);
};

export const getPendingShows = async (params = {}) => {
  return axiosClient.get('/admin/shows/pending', { params });
};

export const reviewShowModeration = async (showId, decision, reviewNote = '') => {
  if (decision !== 'Approved' && decision !== 'Rejected') {
    return Promise.reject(new Error('decision chỉ nhận "Approved" hoặc "Rejected"'));
  }
  return axiosClient.post(`/admin/shows/${showId}/review`, {
    decision,
    reviewNote,
  });
};