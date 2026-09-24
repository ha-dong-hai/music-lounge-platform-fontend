import axiosClient from '../config/axios';

export const getMyTickets = async (params = {}) => {
  return axiosClient.get('/tickets/my', { params });
};

export const getTicketDetail = async (id) => {
  return axiosClient.get(`/tickets/${id}`);
};

export const holdTicket = async (priceId, quantity) => {
  return axiosClient.post('/tickets/holds', { priceId, quantity });
};

export const cancelHold = async (holdId) => {
  return axiosClient.delete(`/tickets/holds/${holdId}`);
};

// Vé người khác đang chuyển cho TÔI, đang chờ tôi đồng ý nhận.
export const getIncomingTicketTransfers = async () => {
  return axiosClient.get('/tickets/incoming-transfers');
};

export const acceptTicketTransfer = async (ticketId) => {
  return axiosClient.post(`/tickets/${ticketId}/transfer/accept`);
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

// ===== HOÀN TIỀN =====
// Khi cổng thanh toán không hoàn được vào giao dịch gốc thì phải chuyển khoản tay — người mua
// khai tài khoản nhận ở đây. `consent` là sự đồng ý cho dùng thông tin ngân hàng để hoàn tiền,
// bắt buộc phải true.
export const provideRefundPayoutAccount = async (refundRequestId, { bankName, accountNumber, accountHolder, consent }) => {
  return axiosClient.put(`/tickets/refund-requests/${refundRequestId}/payout-account`, {
    bankName, accountNumber, accountHolder, consent,
  });
};

// Người mua xác nhận đã nhận lại TIỀN MẶT tại quầy — vé bán tại quầy không hoàn qua cổng thanh toán.
export const confirmCashRefundHandedBack = async (refundRequestId) => {
  return axiosClient.post(`/tickets/refund-requests/${refundRequestId}/cash-handed-back`);
};