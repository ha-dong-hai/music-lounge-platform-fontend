import axiosClient from '../config/axios';

export const getMyProfile = async () => {
  return axiosClient.get('/me');
};

export const updateProfile = async (payload) => {
  return axiosClient.put('/me/profile/', payload);
};