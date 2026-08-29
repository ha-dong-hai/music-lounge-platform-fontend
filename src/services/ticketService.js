import axiosInstance from '../config/axios';

export const ticketService = {
  holdTicket: async ({ priceId, quantity }) => {
    const response = await axiosInstance.post('/api/v1/tickets/holds', {
      priceId,
      quantity,
    });
    return response.data;
  },

  purchaseTicket: async ({ holdId }) => {
    const response = await axiosInstance.post('/api/v1/tickets/purchase', {
      holdId,
    });
    return response.data;
  },

  cancelHold: async (holdId) => {
    const response = await axiosInstance.delete(`/api/v1/tickets/holds/${holdId}`);
    return response.data;
  },

  getMyTickets: async ({ page = 1, pageSize = 10 } = {}) => {
    const response = await axiosInstance.get('/api/v1/tickets/my', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getTicketDetail: async (id) => {
    const response = await axiosInstance.get(`/api/v1/tickets/${id}`);
    return response.data;
  },

  getTicketQR: async (id) => {
    const response = await axiosInstance.get(`/api/v1/tickets/${id}/qr`);
    return response.data;
  },

  cancelTicket: async (id) => {
    const response = await axiosInstance.post(`/api/v1/tickets/${id}/cancel`);
    return response.data;
  },

  // Transfer
  initiateTransfer: async (ticketId, { recipientEmail }) => {
    const response = await axiosInstance.post(`/api/v1/tickets/${ticketId}/transfer`, {
      recipientEmail,
    });
    return response.data;
  },

  acceptTransfer: async (ticketId) => {
    const response = await axiosInstance.post(`/api/v1/tickets/${ticketId}/transfer/accept`);
    return response.data;
  },

  cancelTransfer: async (ticketId) => {
    const response = await axiosInstance.post(`/api/v1/tickets/${ticketId}/transfer/cancel`);
    return response.data;
  },

  getIncomingTransfers: async () => {
    const response = await axiosInstance.get('/api/v1/tickets/incoming-transfers');
    return response.data;
  },

  // My refund requests
  getMyRefundRequests: async (params) => {
    const response = await axiosInstance.get('/api/v1/tickets/refund-requests/my', { params });
    return response.data;
  },

  // Walk-in ticket (owner/staff)
  walkIn: async ({ priceId, quantity, method }) => {
    const response = await axiosInstance.post('/api/v1/tickets/walk-in', {
      priceId, quantity, method,
    });
    return response.data;
  },

  // Check-in by QR
  getByQR: async (qrCode) => {
    const response = await axiosInstance.get(`/api/v1/tickets/by-qr/${qrCode}`);
    return response.data;
  },

  checkIn: async (qrCode) => {
    const response = await axiosInstance.post('/api/v1/tickets/check-in', { qrCode });
    return response.data;
  },
};
