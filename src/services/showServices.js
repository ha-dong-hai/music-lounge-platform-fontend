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

// ===== POSTER =====
// Poster AI (chỉ gói dịch vụ có tính năng này). `styleHint` KHÔNG bắt buộc và KHÔNG phải prompt:
// máy chủ tự ghép prompt từ dữ liệu buổi diễn rồi nối câu này vào cuối.
//
// HAI KẾT CỤC, PHẢI RẼ THEO `data.status`, KHÔNG rẽ theo mã HTTP.
//
// Máy chủ chọn MỘT nhà cung cấp lúc dựng dịch vụ (`AiImageProvider.Chon`), theo thứ tự ưu tiên
// Gemini → hàng đợi máy trạm → Cloudflare → OpenAI, dựa trên biến môi trường nào đã khai. ĐÂY KHÔNG
// PHẢI CHUỖI DỰ PHÒNG LÚC CHẠY: nhà cung cấp đang dùng mà lỗi thì lời gọi THẤT BẠI (503), không tự
// rơi xuống nhà cung cấp sau. Backend cố ý chưa bật chuỗi dự phòng vì rơi từ Gemini xuống Cloudflare
// sẽ cho ra poster CHỮ HỎNG thay vì một câu lỗi — mà poster hỏng tệ hơn lỗi, vì chủ phòng trà có thể
// đem đi đăng. Vậy nên đừng viết UI kiểu "đang thử nhà cung cấp khác".
// FE không biết và không nên đoán đang chạy cái nào — đó chính là lý do trường `status` tồn tại:
//   - `status = 'Succeeded'`: `imageUrl` có ngay, `attemptId = null`. Đường đồng bộ, đo thật ~15–16
//     giây một lượt → cần một trạng thái CHỜ, không cần vòng hỏi lại.
//   - `status = 'Queued'`: `imageUrl` rỗng, `attemptId` là mã đơn. Đường máy trạm Google Flow; ảnh
//     xong sau hàng phút, hỏi lại qua getAiPosterHistory và chủ phòng trà nhận thông báo.
// `remainingThisMonth` là NƠI DUY NHẤT đọc được số lượt còn lại trong tháng — không có endpoint đọc
// riêng, và gói chỉ cho biết trần. Đừng bỏ trường này.
// Bấm lại khi đang có đơn chờ → 409, KHÔNG tạo đơn thứ hai (chỉ xảy ra ở đường hàng đợi).
// 503 khi nhà cung cấp AI lỗi — lần thất bại KHÔNG bị trừ vào hạn mức tháng.
export const generateAiPoster = async (showId, styleHint = null) => {
  return axiosClient.post(`/lounge-shows/${showId}/ai-poster`, { styleHint });
};

export const getAiPosterHistory = async (showId) => {
  return axiosClient.get(`/lounge-shows/${showId}/ai-poster/history`);
};

// Tự tải poster riêng. Ghi đè poster đang có và bỏ cờ "do AI tạo".
export const setShowPoster = async (showId, imageUrl) => {
  return axiosClient.put(`/lounge-shows/${showId}/poster`, { imageUrl });
};

// ===== THAY ĐỔI SAU KHI ĐÃ ĐĂNG =====
// Dời lịch: đây là thay đổi ẢNH HƯỞNG NGƯỜI ĐÃ MUA VÉ. Backend tự lo thông báo và quyền của
// người mua theo chính sách; FE chỉ cần nói rõ hệ quả trước khi bấm.
export const rescheduleShow = async (showId, newScheduledStart) => {
  return axiosClient.post(`/lounge-shows/${showId}/reschedule`, { newScheduledStart });
};

// Đổi hình thức (Offline/Online/Hybrid). Đổi sang hình thức người mua KHÔNG trả tiền cho là căn cứ
// hoàn 100% theo chính sách nền tảng — nói rõ điều này trước khi đổi.
export const changeShowFormat = async (showId, newFormat) => {
  return axiosClient.put(`/lounge-shows/${showId}/format`, { newFormat });
};

// Chỉ có nghĩa với buổi Online/Hybrid. 'TwoD' = video phẳng thông thường (mặc định),
// 'ThreeD' = video được dán lên màn hình sân khấu trong không gian 3D.
export const setShowPlaybackMode = async (showId, playbackMode) => {
  return axiosClient.put(`/lounge-shows/${showId}/playback-mode`, { playbackMode });
};

// Sửa một tiết mục trong line-up (đổi nghệ sĩ, giờ diễn, thứ tự).
export const updatePerformance = async (showId, performanceId, payload) => {
  return axiosClient.put(`/lounge-shows/${showId}/performances/${performanceId}`, payload);
};

// DANH SÁCH NGƯỜI ĐÃ MUA VÉ của một buổi diễn — KHÔNG phải đơn gọi món (ghi chú cũ ở đây sai).
// Dùng để chủ phòng trà đối soát và đón khách: có tên và email người mua, nên chỉ chủ venue đó hoặc
// Admin gọi được (403 nếu khác). Khác getShowTicketStats vốn chỉ trả con số tổng.
// Vì có dữ liệu cá nhân, đừng đưa danh sách này lên màn nào mà người ngoài xem được.
export const getShowOrders = async (showId, params = {}) => {
  return axiosClient.get(`/lounge-shows/${showId}/orders`, { params });
};

// ===== CÔNG KHAI =====
// Gợi ý tìm kiếm theo từ khoá đang gõ (autocomplete).
export const getShowSuggestions = async (q, limit = 8) => {
  return axiosClient.get('/lounge-shows/suggestions', { params: { q, limit } });
};

export const getShowsByLounge = async (loungeId, params = {}) => {
  return axiosClient.get(`/lounge-shows/by-lounge/${loungeId}`, { params });
};

export const getShowsByPerformer = async (performerId, params = {}) => {
  return axiosClient.get(`/lounge-shows/by-performer/${performerId}`, { params });
};

// Sơ đồ chỗ của buổi diễn — khu vực kèm vị trí 2D đã đặt ở màn Khu vực chỗ ngồi.
export const getShowSeatingMap = async (showId) => {
  return axiosClient.get(`/lounge-shows/${showId}/seating-map`);
};

export const getSimilarShows = async (showId) => {
  return axiosClient.get(`/lounge-shows/${showId}/similar`);
};

export const getShowRatings = async (showId, params = {}) => {
  return axiosClient.get(`/lounge-shows/${showId}/ratings`, { params });
};
