import axiosClient from '../config/axios';

// Án phạt phòng trà (BR-28): Warning (cảnh cáo) / Suspension (đình chỉ có thời hạn) / Ban (cấm).
// Phòng trà bị đình chỉ hoặc cấm thì KHÔNG mở buổi diễn mới và không bán vé được — đây là thứ
// ảnh hưởng trực tiếp tới việc kinh doanh, nên màn hình phải nói rõ hiệu lực và hạn khiếu nại.

// Admin ra án phạt. penaltyType: 'Warning' | 'Suspension' | 'Ban'.
// suspensionDays chỉ có ý nghĩa với Suspension.
export const issuePenalty = async ({ loungeId, penaltyType, reason, evidenceRef = null, suspensionDays = null }) => {
  return axiosClient.post('/venue-penalties', { loungeId, penaltyType, reason, evidenceRef, suspensionDays });
};

// Chủ phòng trà xem mọi án phạt đã bị áp lên phòng trà của mình, mọi trạng thái.
export const getMyPenalties = async (params = {}) => {
  return axiosClient.get('/venue-penalties/mine', { params });
};

// Khiếu nại án phạt. CHỈ gửi được trước `appealDeadline` — quá hạn backend từ chối.
export const submitPenaltyAppeal = async (id, appealReason) => {
  return axiosClient.post(`/venue-penalties/${id}/appeal`, { appealReason });
};

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
