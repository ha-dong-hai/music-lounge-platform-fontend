import axiosClient from '../config/axios';

export const getMyTickets = async (params = {}) => {
  return axiosClient.get('/tickets/my', { params });
};

export const getTicketDetail = async (id) => {
  return axiosClient.get(`/tickets/${id}`);
};

// Giữ chỗ tạm (mặc định 15 phút) trước khi mua — trả { holdId, expiresAt }
export const holdTicket = async (priceId, quantity) => {
  return axiosClient.post('/tickets/holds', { priceId, quantity });
};

export const cancelHold = async (holdId) => {
  return axiosClient.delete(`/tickets/holds/${holdId}`);
};

// Tạo đơn hàng thật từ 1 hold còn hiệu lực — trả PaymentInitiationDto có paymentUrl VNPay thật
export const purchaseTicket = async (holdId) => {
  return axiosClient.post('/tickets/purchase', { holdId });
};

export const cancelTicket = async (id) => {
  return axiosClient.post(`/tickets/${id}/cancel`);
};

export const getMyRefundRequests = async (params = {}) => {
  return axiosClient.get('/tickets/refund-requests/my', { params });
};