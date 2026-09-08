import axiosClient from '../config/axios';

export const getPackages = async (activeOnly = false) => {
  return axiosClient.get('/subscriptions/packages', { params: { activeOnly } });
};

export const createPackage = async (payload) => {
  return axiosClient.post('/subscriptions/packages', payload);
};

export const updatePackage = async (id, payload) => {
  return axiosClient.put(`/subscriptions/packages/${id}`, payload);
};