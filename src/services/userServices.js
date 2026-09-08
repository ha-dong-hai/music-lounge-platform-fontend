import axiosClient from '../config/axios';

export const getMyProfile = async () => {
  return axiosClient.get('/me');
};

export const updateProfile = async (payload) => {
  return axiosClient.put('/me/profile/', payload);
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosClient.post('/uploads/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};