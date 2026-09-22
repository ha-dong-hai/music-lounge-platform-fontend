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

// ===== SAO KÊ DONATE CÔNG KHAI CỦA NGHỆ SĨ (không cần đăng nhập) =====
// Đây là trang minh bạch: khán giả tặng tiền xong phải xem được tiền đã tới nghệ sĩ hay chưa.
// KHÔNG chứa số tài khoản, mã chuyển khoản hay ảnh chứng từ — `hasTransferReceipt` chỉ nói là CÓ
// chứng từ được lưu, còn bản thân chứng từ thì không công khai.
//
// Mỗi dòng có `stage` (PlatformHolding | VenueHolding | VenueReportedPaid | PerformerConfirmed |
// PerformerDisputed) kèm `stageLabel` sẵn tiếng Việt — DÙNG stageLabel để hiện, dùng stage để so sánh.
// `gross` có thể null với dữ liệu cũ không công khai số tiền; summary có `donationsWithHiddenAmount`
// cho biết có bao nhiêu khoản như vậy để không ai tưởng tổng bị tính sai.
export const getPerformerPublicDonations = async (performerId, params = {}) => {
  return axiosClient.get(`/performers/${performerId}/donations`, { params });
};

// Trừ `totalGross`, mọi số tiền trong summary là PHẦN CỦA NGHỆ SĨ, chia theo nơi tiền đang nằm:
// heldByPlatform → nền tảng còn giữ, heldByVenue → phòng trà còn giữ, overdueAtVenue → quá hạn chưa
// chuyển. Cộng ba cái đó ra tổng chưa tới tay nghệ sĩ.
export const getPerformerDonationSummary = async (performerId) => {
  return axiosClient.get(`/performers/${performerId}/donations/summary`);
};
