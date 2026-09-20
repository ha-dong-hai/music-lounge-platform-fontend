import axiosClient from '../config/axios';

// Donate đi qua VNPay giống hệt mua vé — trả về paymentUrl thật, không xác nhận ngay tức thời.
export const createDonation = async ({ performanceId, amount, isAnonymous = false, message = null, isMessagePublic = true }) => {
  return axiosClient.post('/donations', { performanceId, amount, isAnonymous, message, isMessagePublic });
};

export const getMyDonations = async (params = {}) => {
  return axiosClient.get('/donations/my', { params });
};

// ===== DONATE PHÍA CHỦ PHÒNG TRÀ — LUỒNG HAI CHẶNG =====
// Tiền donate KHÔNG đi trực tiếp tỉ nghệ sĩ: nền tảng thu, chuyển cho phòng trà, rồi phòng trà
// chuyển tiếp cho nghệ sĩ. Mỗi chặng cần chủ xác nhận một lần:
//   Chặng 1 — acknowledge : "tôi đã nhận được tiền từ nền tảng"
//   Chặng 2 — confirmPaid : "tôi đã chuyển tiền cho nghệ sĩ", kèm mã giao dịch và chứng từ
// KHÔNG có luồng hoàn tiền cho donate đã xác nhận — đừng dựng nút "hoàn donate".

export const getDonationsPendingAck = async (params = {}) => {
  return axiosClient.get('/donations/pending-ack', { params });
};

export const getDonationsAwaitingPayout = async (params = {}) => {
  return axiosClient.get('/donations/awaiting-payout', { params });
};

// Trả về bản tổng hợp (OwnerDonationHistorySummaryDto), không phải mảng trần.
export const getOwnerDonationHistory = async (params = {}) => {
  return axiosClient.get('/donations/owner-history', { params });
};

export const acknowledgeDonation = async (id) => {
  return axiosClient.post(`/donations/${id}/acknowledge`);
};

// paymentRef: mã giao dịch chuyển khoản. paymentEvidenceUrl: ảnh chứng từ (tải lên /uploads/images trước).
export const confirmDonationPaid = async (id, { paymentRef, paymentEvidenceUrl = null }) => {
  return axiosClient.post(`/donations/${id}/confirm-paid`, { paymentRef, paymentEvidenceUrl });
};

// Gỡ lời nhắn của một donate khỏi livestream. KHÔNG hoàn tiền; lời nhắn gốc vẫn được lưu để đối chiếu.
// Người đang xem nhận sự kiện SignalR DonationMessageHidden.
export const hideDonationMessage = async (id) => {
  return axiosClient.post(`/donations/${id}/hide-message`);
};
