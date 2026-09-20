import axiosClient from '../config/axios';

export const getAdminStats = async () => {
  const [all, audience, owner, staff, banned] = await Promise.all([
    axiosClient.get('/admin/users', { params: { pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Audience', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Owner', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { role: 'Staff', pageSize: 1 } }),
    axiosClient.get('/admin/users', { params: { isActive: false, pageSize: 1 } }),
  ]);
  return {
    total: all.data.totalCount,
    users: audience.data.totalCount,
    owners: owner.data.totalCount,
    staff: staff.data.totalCount,
    banned: banned.data.totalCount,
  };
};

export const getAdminUsers = async (params = {}) => {
  return axiosClient.get('/admin/users', { params });
};

export const getAdminUserDetail = async (id) => {
  return axiosClient.get(`/admin/users/${id}`);
};

export const toggleUserBan = async (id, isActive) => {
  if (isActive) {
    return axiosClient.post(`/admin/users/${id}/deactivate`);
  }
  return axiosClient.post(`/admin/users/${id}/reactivate`);
};

export const getPendingModerations = async (params = {}) => {
  return axiosClient.get('/moderations/pending', { params });
};

export const reviewShowModeration = async (showId, decision, reviewNote = '') => {
  if (decision !== 'Approved' && decision !== 'Rejected') {
    return Promise.reject(new Error('decision chỉ nhận "Approved" hoặc "Rejected"'));
  }
  return axiosClient.post(`/moderations/shows/${showId}/review`, {
    decision,
    reviewNote,
  });
};

// Hàng đợi khiếu nại cho Admin. Đường cũ '/admin/complaints' KHÔNG TỎN TẠI trên backend
// (đã gọi thật: 404) — đúng là '/complaints/pending'.
// Lưu ý phạm vi: endpoint này CHỈ trả khiếu nại status Open + Investigating, sắp xếp id
// giảm dần. Backend chưa có đường nào xem khiếu nại ĐÃ xử lý, nên đừng trông đợi
// Resolved/Rejected xuất hiện ở đây.
// Tham số: page (mặc định 1), pageSize (mặc định 10, backend kẹp 1..50).
export const getAdminComplaints = async (params = {}) => {
  return axiosClient.get('/complaints/pending', { params });
};

// Lịch sử khiếu nại cho Admin — MỌI trạng thái, không chỉ hàng đợi đang mở (MLACP-462).
// status: mảng, gửi lặp kiểu ?status=Resolved&status=Rejected (paramsSerializer trong axios.js lo sẵn).
//   Bỏ trống = mọi trạng thái. Tên sai → 422, message liệt kê các giá trị hợp lệ.
// pageSize mặc định 20 (KHÁC /complaints/pending mặc định 10). Item cùng ComplaintDto với /pending.
// Mỗi lần gọi backend GHI LOG kèm mã Admin + bộ lọc, vì dữ liệu gồm mô tả và số điện thoại
// người khiếu nại (kể cả khách không đăng nhập) — đừng gọi nền / gọi thừa.
export const getComplaintHistory = async (params = {}) => {
  return axiosClient.get('/admin/complaints', { params });
};

export const getAdminVenues = async (params = {}) => {
  return axiosClient.get('/admin/venues/pending', { params });
};

export const reviewLivestreamModeration = async (livestreamId, decision, reviewNote = '') => {
  if (decision !== 'Approved' && decision !== 'Rejected') {
    return Promise.reject(new Error('decision chỉ nhận "Approved" hoặc "Rejected"'));
  }
  return axiosClient.post(`/moderations/livestreams/${livestreamId}/review`, {
    decision,
    reviewNote,
  });
};

// ===== DANH MỤC LỌC (thể loại nhạc / tâm trạng / không gian / loại buổi diễn) — Admin CRUD =====
// typeKey trùng đoạn đường dẫn của backend, nhưng vẫn qua danh sách cho phép: không ghép thẳng
// chuỗi gọi từ giao diện vào URL.
// PUT và DELETE trả 204 không body — interceptor trong config/axios.js quy về { success: true, data: null }.
// 409 khi trùng tên, hoặc khi xoá mục đang được buổi diễn sử dụng; message của backend nói rõ lý do.
//
// MỖI LOẠI MỘT BODY KHÁC NHAU, ĐỪNG GỬI CHUNG:
//   genres          POST/PUT { name, nameEn }
//   moods           POST/PUT { name }
//   atmospheres     POST/PUT { name }
//   eventCategories POST { name, description } — PUT { name, description, isActive }
// Loại buổi diễn là cái duy nhất có isActive, và PUT là GHI ĐÈ TOÀN BỘ: thiếu trường nào là xoá
// trường đó. Danh sách /catalog/event-categories CHỈ trả id + name của mục đang bật, nên giao diện
// không biết description cũ — xem ghi chú ở OptionFormModal trước khi sửa chỗ này.
const FILTER_OPTION_TYPES = {
  genres: {
    segment: 'genres',
    body: (d) => ({ name: d.name, nameEn: d.nameEn || null }),
  },
  moods: {
    segment: 'moods',
    body: (d) => ({ name: d.name }),
  },
  atmospheres: {
    segment: 'atmospheres',
    body: (d) => ({ name: d.name }),
  },
  eventCategories: {
    segment: 'event-categories',
    // isActive chỉ có trong body PUT; POST không nhận trường này (mục mới luôn đang bật).
    body: (d, { dangSua } = {}) => (dangSua
      ? { name: d.name, description: d.description || null, isActive: d.isActive !== false }
      : { name: d.name, description: d.description || null }),
  },
};

const filterOptionType = (typeKey) => {
  const cauHinh = FILTER_OPTION_TYPES[typeKey];
  if (!cauHinh) throw new Error(`Loại danh mục lọc không hợp lệ: ${typeKey}`);
  return cauHinh;
};

const filterOptionPath = (typeKey) => `/admin/${filterOptionType(typeKey).segment}`;

export const createFilterOption = async (typeKey, data) => {
  const cauHinh = filterOptionType(typeKey);
  return axiosClient.post(`/admin/${cauHinh.segment}`, cauHinh.body(data, { dangSua: false }));
};

export const updateFilterOption = async (typeKey, id, data) => {
  const cauHinh = filterOptionType(typeKey);
  return axiosClient.put(`/admin/${cauHinh.segment}/${id}`, cauHinh.body(data, { dangSua: true }));
};

export const deleteFilterOption = async (typeKey, id) => {
  return axiosClient.delete(`${filterOptionPath(typeKey)}/${id}`);
};

// ===== DUYỆT HỒ SƠ PHÒNG TRÀ =====
// Phòng trà ở trạng thái Pending KHÔNG hiện trong danh sách công khai và KHÔNG mở bán vé được.
// Không duyệt thì chủ phòng trà treo vô thời hạn — đây là cửa chặn đầu tiên của toàn bộ luồng.
// decision: 'Approved' | 'Rejected'. Từ chối thì reviewNote là thứ duy nhất cho chủ biết phải sửa gì.
export const reviewVenue = async (loungeId, decision, reviewNote = '') => {
  if (decision !== 'Approved' && decision !== 'Rejected') {
    return Promise.reject(new Error('decision chỉ nhận "Approved" hoặc "Rejected"'));
  }
  return axiosClient.post(`/admin/venues/${loungeId}/review`, { decision, reviewNote });
};

// ===== DUYỆT ĐỊNH DANH (KYC) =====
// status: 'Pending' | 'Approved' | 'Rejected'. Mỗi dòng là MỘT NGƯỜI với tối đa HAI giấy tờ
// (CCCD và hồ sơ thuế) được duyệt ĐỘC LẬP nhau.
export const getKycReviewQueue = async (params = {}) => {
  return axiosClient.get('/admin/kyc-reviews', { params });
};

// document: 'CitizenCard' | 'TaxProfile'. userId là mã người dùng, không phải mã giấy tờ.
// ⚠ TỪ CHỐI thì `note` LÀ BẮT BUỘC: người gửi phải biết phải sửa gì, "bị từ chối" mà không kèm lý do
// thì họ không làm gì được tiếp.
export const reviewKycDocument = async (userId, document, { approve, note = null }) => {
  return axiosClient.post(`/admin/kyc-reviews/${userId}/${document}`, { approve, note });
};

// Ảnh CCCD của người khác — trả về FILE nhị phân. side: 'front' | 'back'.
// Admin xem giấy tờ của người khác thì backend GHI LOG, nên đừng gọi nền hay gọi thửa.
export const getUserCitizenCardImage = async (userId, side) => {
  return axiosClient.get(`/admin/users/${userId}/citizen-card/${side}`, { responseType: 'blob' });
};

// ===== DUYỆT TÀI KHOẢN NHẬN TIỀN =====
// LƯU Ý: backend CHƯA có endpoint liệt kê tài khoản chờ duyệt, nên chưa dựng được hàng đợi riêng.
// Hàm này dùng khi đã biết mã tài khoản từ ngữ cảnh khác (ví dụ màn quyết toán).
// Tên chủ tài khoản phải khớp tên định danh hợp pháp của chủ phòng trà; lệch thì từ chối.
export const reviewPayoutBankAccount = async (bankAccountId, { approve, note = null }) => {
  return axiosClient.post(`/admin/bank-accounts/${bankAccountId}/review`, { approve, note });
};

// ===== GỠ ĐÁNH GIÁ =====
// `reason` BẮT BUỘC. LƯU Ý: gỡ đánh giá qua hàng đợi báo cáo nội dung (content-reports/resolve với
// action 'Removed') cũng dẫn tới cùng kết quả. Dùng hàm này khi gỡ trực tiếp mà không đi từ báo cáo nào.
export const removeRating = async (ratingId, reason) => {
  return axiosClient.post(`/admin/ratings/${ratingId}/remove`, { reason });
};

// ===== CẤU HÌNH HỆ THỐNG =====
// Trả về MẢNG TRẦN các tham số. isMoneyRate đánh dấu tham số liên quan TỈ LỆ TIỀN — nhóm này có
// ràng buộc chéo với nhau, đổi một cái có thể bị từ chối nếu tổng vượt ngưỡng cho phép.
export const getSystemConfigs = async () => {
  return axiosClient.get('/admin/system-config');
};

export const getSystemConfigHistory = async (key) => {
  return axiosClient.get(`/admin/system-config/${encodeURIComponent(key)}/history`);
};

// ⚠ `note` BẮT BUỘC — đây là lý do ghi vào lịch sử thay đổi, không phải trường phụ. Đổi một tỉ lệ tiền
// mà không ai biết vì sao là thứ không truy được về sau.
export const updateSystemConfig = async (key, { configValue, note }) => {
  return axiosClient.put(`/admin/system-config/${encodeURIComponent(key)}`, { configValue, note });
};

// Duyệt HẠNG VÉ bị đưa vào diện kiểm duyệt (cùng hệ với duyệt buổi phát).
// decision: 'Approved' | 'Rejected'. Hạng vé chưa duyệt KHÔNG được tính vào khoảng giá hiển thị
// trên thẻ buổi diễn, nên bỏ quên hàng đợi này là vé của chủ không bán được mà họ không hiểu vì sao.
export const reviewTicketTier = async (tierId, decision, reviewNote = '') => {
  if (decision !== 'Approved' && decision !== 'Rejected') {
    return Promise.reject(new Error('decision chỉ nhận "Approved" hoặc "Rejected"'));
  }
  return axiosClient.post(`/moderations/ticket-tiers/${tierId}/review`, { decision, reviewNote });
};

// ===== SOÁT CẤU HÌNH HỆ THỐNG =====
// Trả về DANH SÁCH CÁI ĐANG THIẾU, không bao giờ trả giá trị cấu hình (không lộ secret).
// Mỗi dòng: { feature, key, impact, severity } với severity: 'Broken' = tính năng không dùng được,
// 'Degraded' = vẫn chạy nhưng mất một lớp. Danh sách rỗng = không thiếu gì.
// Đây là thứ đọc TRƯỚC khi đi tìm lỗi "tự nhiên tính năng X không chạy trên môi trường này".
export const getConfigurationAudit = async () => axiosClient.get('/admin/configuration-audit');

// ===== KIỂM TRA TOÀN VẸN SỔ CÁI =====
// Mỗi dòng là một bút toán LỆCH: { issueType, journalId, debitTotal, creditTotal, detail }.
// Danh sách rỗng = sổ cái cân. Có dòng nào là chuyện của kế toán, KHÔNG phải lỗi giao diện —
// đừng "sửa" bằng cách ẩn đi.
export const getLedgerIntegrityCheck = async () => axiosClient.get('/admin/ledger/integrity-check');

// ===== TÁC VỤ ĐỊNH KỲ (HANGFIRE) =====
// getRecurringJobs trả về MẢNG CHUỖI (id của job), không phải object — không có tên hiển thị,
// không có lần chạy gần nhất, không có trạng thái. Muốn xem chi tiết thì vào dashboard Hangfire.
// triggerRecurringJob chạy job NGAY. Vài job trong số này động vào tiền (quyết toán, án phạt),
// backend có ghi log ai bấm — nên giao diện phải hỏi lại trước khi chạy.
export const getRecurringJobs = async () => axiosClient.get('/admin/jobs');

export const triggerRecurringJob = async (jobId) => {
  if (!jobId) return Promise.reject(new Error('Thiếu id tác vụ.'));
  return axiosClient.post(`/admin/jobs/${encodeURIComponent(jobId)}/trigger`);
};

// ===== NHẬT KÝ BẰNG CHỨNG CỦA MỘT KHOẢN DONATE =====
// Chuỗi sự kiện có băm nối tiếp nhau (hash / previousHash). `chainIntact = false` nghĩa là có dòng
// bị sửa, bị xoá hoặc bị chèn thêm sau khi ghi — và `firstBrokenSequence` là dòng đầu tiên lệch.
// Đây là bằng chứng dùng khi nghệ sĩ và phòng trà nói khác nhau về việc đã chuyển tiền chưa.
export const getDonationEvidence = async (donationId) =>
  axiosClient.get(`/admin/donations/${donationId}/evidence`);
