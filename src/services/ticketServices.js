import axiosClient from '../config/axios';

export const getMyTickets = async (params = {}) => {
  return axiosClient.get('/tickets/my', { params });
};

export const getTicketDetail = async (id) => {
  return axiosClient.get(`/tickets/${id}`);
};