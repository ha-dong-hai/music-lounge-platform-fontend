import axiosClient from '../config/axios';

export const getShows = async (params = {}) => {
  return axiosClient.get('/lounge-shows', { params });
};

export const getShowDetail = async (id) => {
  return axiosClient.get(`/lounge-shows/${id}`);
};

export const searchShows = async (params = {}) => {
  return axiosClient.get('/lounge-shows/search', { params });
};

export const getFilterOptions = async () => {
  return axiosClient.get('/lounge-shows/filter-options');
};

export const getTrendingShows = async (params = {}) => {
  return axiosClient.get('/lounge-shows/trending', { params });
};

// Gợi ý cá nhân hoá thật — KHÁC hẳn /trending (trending chỉ xếp theo độ hot chung, ai vào cũng
// thấy như nhau). Backend tự chọn 1 trong 3 mức tuỳ thông tin có được về người hỏi: đã đăng nhập +
// bật AiConsent + có kết quả tính sẵn còn hạn -> lọc cộng tác ML.NET kèm lời giải thích do AI viết;
// chỉ đăng nhập -> xếp theo sở thích khai lúc onboarding + phòng trà đang theo dõi; chưa đăng nhập
// -> xếp theo ngữ cảnh gửi kèm (recentShowIds/genreIds/city), không lưu lại gì.
// Mỗi item trả thêm recommendationScore + recommendationReason so với DTO show thường.
export const getRecommendedShows = async (params = {}) => {
  return axiosClient.get('/recommendations', { params });
};

// Danh sách hạng vé (kèm mức giá) của 1 show — mỗi tier có prices[]: {id, name, price, quota,...}
export const getTicketTiers = async (showId) => {
  return axiosClient.get('/ticket-tiers', { params: { showId } });
};

// Chấm sao 1-5 + nhận xét sau khi show kết thúc — chỉ mở trong 7 ngày, 409 nếu đã đánh giá rồi.
export const rateShow = async (id, { score, comment }) => {
  return axiosClient.post(`/lounge-shows/${id}/rate`, { score, comment });
};

// ===== QUẢN LÝ BUỔI DIỄN — PHÍA CHỦ PHÒNG TRÀ =====

// Danh sách buổi diễn của chính chủ đang đăng nhập, MỌI trạng thái kể cả Draft, lọc được theo status.
export const getMyShows = async (params = {}) => {
  return axiosClient.get('/lounge-shows/mine', { params });
};

// Tạo buổi diễn — luôn sinh ra ở trạng thái Draft, chưa ai thấy được cho tới khi gửi duyệt và
// được Admin duyệt. Bắt buộc: loungeId, name, description, format (Offline/Online/Hybrid),
// scheduledStart (phải ở tương lai). Các mảng genreIds/moodIds/atmosphereIds/performances để rỗng được.
export const createShow = async (payload) => {
  return axiosClient.post('/lounge-shows', payload);
};

// CẢNH BÁO: đây là PUT toàn phần, KHÔNG phải vá từng trường. Bỏ trống 3 trường chính sách hoàn tiền
// (cancellationAllowed/refundPercentage/cancellationDeadlineHours) nghĩa là TRẢ VỀ MẶC ĐỊNH
// (cho huỷ, hoàn 100%, không hạn chót) — không phải giữ nguyên giá trị cũ. Chỉ sửa được khi còn Draft.
export const updateShow = async (id, payload) => {
  return axiosClient.put(`/lounge-shows/${id}`, payload);
};

// Gửi duyệt. Backend kiểm đủ 4 điều kiện, thiếu cái nào trả 422 kèm lý do cụ thể:
// >= 1 hạng vé, >= 1 nghệ sĩ trong line-up, đã khai văn bản chấp thuận biểu diễn (NĐ 144/2020 Điều 10),
// và nộp trước tối thiểu N ngày làm việc so với ngày diễn.
export const submitShow = async (id) => {
  return axiosClient.post(`/lounge-shows/${id}/submit`);
};

// Huỷ buổi diễn ĐÃ ĐĂNG: vé Confirmed bị huỷ kèm tự tạo yêu cầu hoàn 100% và báo tới từng người mua.
export const cancelShow = async (id) => {
  return axiosClient.post(`/lounge-shows/${id}/cancel`);
};

export const deleteShow = async (id) => {
  return axiosClient.delete(`/lounge-shows/${id}`);
};

// D18 (NĐ 144/2020 Điều 10) — số văn bản/liên kết "văn bản chấp thuận tổ chức biểu diễn".
// Bắt buộc phải khai trước khi gửi duyệt. Chỉ sửa được khi còn Draft.
export const setLegalApproval = async (id, legalApprovalReference) => {
  return axiosClient.put(`/lounge-shows/${id}/legal-approval`, { legalApprovalReference });
};

// Line-up. Dùng performerId khi chọn nghệ sĩ đã có hồ sơ, hoặc performerName khi nhập tay tên khách mời.
// setTime là giờ trong ngày dạng "HH:mm:ss" (TimeOnly phía backend), để null nếu chưa xếp giờ.
export const addPerformance = async (showId, payload) => {
  return axiosClient.post(`/lounge-shows/${showId}/performances`, payload);
};

export const deletePerformance = async (showId, performanceId) => {
  return axiosClient.delete(`/lounge-shows/${showId}/performances/${performanceId}`);
};

// D19 — bắt buộc trước khi Start livestream. vcpmcRoyaltyReference là mã tham chiếu đã trả tác quyền.
export const setVcpmcRoyalty = async (id, vcpmcRoyaltyReference) => {
  return axiosClient.put(`/lounge-shows/${id}/vcpmc-royalty`, { vcpmcRoyaltyReference });
};

// ===== VẬN HÀNH ĐÊM DIỄN (chủ hoặc nhân viên — RequireVenueOperator) =====

export const startShow = async (id) => {
  return axiosClient.post(`/lounge-shows/${id}/start`);
};

// LƯU Ý: có tác vụ nền tự kết thúc buổi diễn sau 6 giờ quá giờ dự kiến. Nên nút "Kết thúc" có thể
// gặp buổi đã tự chuyển Ended trước khi người dùng bấm — đó không phải lỗi, xử lý như "đã kết thúc rồi".
export const endShow = async (id) => {
  return axiosClient.post(`/lounge-shows/${id}/end`);
};

// Thống kê vé của một buổi diễn: tổng bán, tổng doanh thu, tổng đã soát, và chi tiết theo từng mức giá
// (ByPrice) — chính là danh sách để bán vé tại quầy, vì priceId nằm sẵn trong đó.
export const getShowTicketStats = async (id) => {
  return axiosClient.get(`/lounge-shows/${id}/ticket-stats`);
};
