import axiosClient from '../config/axios';

// Hàng đợi khiếu nại án phạt cho Admin. resolved=false là chưa xử lý; resolved=true để tra lại.
// Trả về CÙNG VenuePenaltyDto mà /venue-penalties/mine trả cho chủ phòng trà, nên dùng lại được
// cách hiển thị — khác nhau ở chỗ đây là mọi phòng trà, còn /mine chỉ phòng trà của người gọi.
export const getPenaltyAppeals = async (params = {}) => {
  return axiosClient.get('/venue-penalties/appeals', { params });
};

// Admin xử lý khiếu nại. decision PHẢI là 'Overturned' (huỷ án phạt) hoặc 'Upheld' (giữ nguyên) —
// backend từ chối giá trị khác kèm câu giải thích.
export const reviewPenaltyAppeal = async (id, { decision, reviewNote = null }) => {
  return axiosClient.post(`/venue-penalties/${id}/appeal/review`, { decision, reviewNote });
};

// Chủ phòng trà xem mọi án phạt đã bị áp lên phòng trà của mình, mọi trạng thái.
export const getMyPenalties = async (params = {}) => {
  return axiosClient.get('/venue-penalties/mine', { params });
};

// Admin ra án phạt. penaltyType: 'Warning' | 'Suspension' | 'Ban'.
// suspensionDays chỉ có ý nghĩa với Suspension.
export const issuePenalty = async ({ loungeId, penaltyType, reason, evidenceRef = null, suspensionDays = null }) => {
  return axiosClient.post('/venue-penalties', { loungeId, penaltyType, reason, evidenceRef, suspensionDays });
};

// Khiếu nại án phạt. CHỈ gửi được trước `appealDeadline` — quá hạn backend từ chối.
export const submitPenaltyAppeal = async (id, appealReason) => {
  return axiosClient.post(`/venue-penalties/${id}/appeal`, { appealReason });
};
