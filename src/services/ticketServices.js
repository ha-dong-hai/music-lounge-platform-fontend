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
