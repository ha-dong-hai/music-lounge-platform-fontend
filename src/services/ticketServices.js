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

// ===== VẬN HÀNH TẠI CỬA (nhân viên / chủ phòng trà) =====

// Tra cứu vé theo mã QR — XEM trước, chưa soát. Dùng để nhân viên đối chiếu tên/hạng vé trước khi bấm
// soát, và để in lại vé bán tại quầy (vé không có người mua).
export const getTicketByQr = async (qrCode) => {
  return axiosClient.get(`/tickets/by-qr/${encodeURIComponent(qrCode)}`);
};

// Soát vé thật sự — ĐỔI TRẠNG THÁI vé, không hoàn tác được. Gọi khi khán giả đã đứng trước cửa.
// Vé đã soát rồi gọi lại thì backend báo lỗi — hiện nguyên câu đó, vì "đã vào rồi" và "vé sai" là hai
// tình huống rất khác nhau với người đứng soát.
export const checkInTicket = async (qrCode) => {
  return axiosClient.post('/tickets/check-in', { qrCode });
};

// Bán vé tại quầy (khách vãng lai, trả tiền mặt).
// clientRequestId là CHỐT CHỐNG THU TIỀN HAI LẦN (MLACP-410): máy quầy sinh một mã cho MỖI LƯỢT BÁN,
// và khi bấm lại vì mất phản hồi thì gửi ĐÚNG mã cũ — máy chủ trả lại lượt bán cũ thay vì tạo vé lần nữa.
// Sinh mã mới cho mỗi lượt bán MỚI, tuyệt đối không dùng lại mã cũ cho khách khác.
export const sellWalkInTicket = async ({ priceId, quantity, clientRequestId }) => {
  return axiosClient.post('/tickets/walk-in', { priceId, quantity, clientRequestId });
};

// ===== CHUYỂN NHƯỢNG VÉ =====
// Người nhận phải ĐÃ CÓ tài khoản trên hệ thống (định danh bằng email) và phải TỰ ĐỒNG Ý nhận —
// vé không tự sang tay ngay khi bạn bấm gửi. Trước khi họ đồng ý, bạn còn huỷ được lượt chuyển.
export const initiateTicketTransfer = async (ticketId, recipientEmail) => {
  return axiosClient.post(`/tickets/${ticketId}/transfer`, { recipientEmail });
};

// Vé người khác đang chuyển cho TÔI, đang chờ tôi đồng ý nhận.
export const getIncomingTicketTransfers = async () => {
  return axiosClient.get('/tickets/incoming-transfers');
};

export const acceptTicketTransfer = async (ticketId) => {
  return axiosClient.post(`/tickets/${ticketId}/transfer/accept`);
};

// Người gửi huỷ lượt chuyển, khi người nhận chưa đồng ý.
export const cancelTicketTransfer = async (ticketId) => {
  return axiosClient.post(`/tickets/${ticketId}/transfer/cancel`);
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
