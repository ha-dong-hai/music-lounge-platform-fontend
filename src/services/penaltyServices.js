import axiosClient from '../config/axios';

// Hàng đợi khiếu nại án phạt cho Admin. resolved=false là chưa xử lý; resolved=true để tra lại.
export const getPenaltyAppeals = async (params = {}) => {
  return axiosClient.get('/venue-penalties/appeals', { params });
};

// Admin xử lý khiếu nại. decision PHẢI là 'Overturned' (huỷ án phạt) hoặc 'Upheld' (giữ nguyên) —
// backend từ chối giá trị khác kèm câu giải thích.
export const reviewPenaltyAppeal = async (id, { decision, reviewNote = null }) => {
  return axiosClient.post(`/venue-penalties/${id}/appeal/review`, { decision, reviewNote });
};
