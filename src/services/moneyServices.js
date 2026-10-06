import axiosClient from '../config/axios';

// ===== HOÀN TIỀN (Admin) =====

// Yêu cầu hoàn tiền đang chờ xử lý (Pending), mới nhất trước.
// Mỗi mục có expectedResolutionBy = hạn trả lời người mua (CreatedAt + refund_sla_hours, mặc định 72h).
export const getPendingRefundRequests = async (params = {}) => {
  return axiosClient.get('/admin/refund-requests', { params });
};

// decision: 'Approved' | 'Rejected'
// CẢNH BÁO VẬN HÀNH: Approved sẽ gọi VNPay Merchant API hoàn tiền THẬT trước, chỉ ghi sổ khi VNPay
// xác nhận thành công. VNPay khoá sẵn chức năng hoàn tiền trên tài khoản sandbox — phải liên hệ
// VNPay mở trước, nếu chưa mở thì trả 503 dù code hoàn toàn đúng.
// approvedAmount bỏ trống = hoàn đúng số đã yêu cầu.
// manualTransferReference dùng khi hoàn bằng chuyển khoản tay (trường hợp VNPay không hoàn được
// giao dịch gốc và người mua đã khai tài khoản nhận tiền).
export const processRefundRequest = async (id, { decision, approvedAmount = null, resolutionNote = null, manualTransferReference = null }) => {
  return axiosClient.post(`/admin/refund-requests/${id}/process`, {
    decision, approvedAmount, resolutionNote, manualTransferReference,
  });
};

// ===== QUYẾT TOÁN (Admin) =====

// Các khoản tiền của phòng trà đang bị GIỮ LẠI chờ Admin quyết, kèm bằng chứng vì sao bị giữ:
// verdict='NeverStarted' (buổi diễn đóng mà chưa từng bắt đầu) hoặc 'Measured' (có diễn nhưng ngắn
// hơn dự kiến — xem ratio so với threshold).
export const getSettlementsPendingReview = async (params = {}) => {
  return axiosClient.get('/admin/settlements/pending-review', { params });
};

// decision: 'Release' (nhả tiền cho phòng trà) | 'Withhold' (giữ lại).
// LƯU Ý: quyết định này KHÔNG tự tạo hoàn tiền cho người mua vé — hoàn tiền đi qua luồng riêng ở trên.
export const reviewSettlement = async (id, { decision, note }) => {
  return axiosClient.post(`/admin/settlements/${id}/review`, { decision, note });
};
