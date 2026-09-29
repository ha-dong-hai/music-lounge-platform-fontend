import axiosClient from '../config/axios';

// Tiêu chí riêng của phòng trà: những thuộc tính chủ tự định nghĩa cho buổi diễn của mình
// (ví dụ "có phục vụ rượu", "độ ồn"), nằm ngoài danh mục chung do Admin quản.
// `key` là mã kỹ thuật để tra cứu, `name` là tên hiển thị.
// SỬA ĐƯỢC GÌ: chỉ `name` và `isActive` (qua updateCustomCriteria). `key`, `dataType`, `options`
// CỐ Ý không sửa được — đổi chúng là làm sai kiểu hoặc làm lạc toàn bộ giá trị đã gắn từ trước.
// KHÔNG có lệnh xoá hẳn: xoá sẽ bỏ lại giá trị mồ côi ở các buổi diễn đã gắn. Tắt là cách đúng.
// `dataType` quyết định kiểu giá trị; với kiểu có danh sách chọn thì `options` là chuỗi các lựa chọn.
export const createCustomCriteria = async ({ loungeId, name, key, dataType, options = null }) => {
  return axiosClient.post('/custom-criteria', { loungeId, name, key, dataType, options });
};

// includeInactive = true thì trả CẢ tiêu chí đã tắt. Mặc định chỉ trả cái đang dùng — đúng cho
// những chỗ chỉ cần danh sách để chọn, nên đừng bật cờ này ở mọi nơi cho tiện.
export const getLoungeCustomCriteria = async (loungeId, includeInactive = false) => {
  return axiosClient.get('/custom-criteria', {
    params: includeInactive ? { loungeId, includeInactive: true } : { loungeId },
  });
};

// Sửa tiêu chí. CHỈ nhận name + isActive; gửi thêm trường khác là gửi thứ backend không đọc.
// Đây cũng là đường TẮT/BẬT một tiêu chí: tắt thì nó biến khỏi danh sách chọn khi tạo buổi diễn,
// nhưng GIÁ TRỊ ĐÃ GẮN cho các buổi diễn cũ VẪN CÒN NGUYÊN.
export const updateCustomCriteria = async (id, { name, isActive }) => {
  return axiosClient.put(`/custom-criteria/${id}`, { name, isActive });
};

// Đọc giá trị tiêu chí đã gán cho một buổi diễn. Trả về KÈM ĐỊNH NGHĨA tiêu chí
// ({criteriaId, name, key, dataType, options, criteriaIsActive, value}) nên không cần gọi thêm
// getLoungeCustomCriteria rồi tự ghép.
// TIÊU CHÍ ĐÃ TẮT VẪN ĐƯỢC TRẢ VỀ kèm criteriaIsActive=false — PHẢI hiện (mờ đi) chứ đừng lọc bỏ:
// thao tác ghi là THAY THẾ TOÀN BỘ, nên bỏ qua rồi lưu là xoá mất giá trị cũ của tiêu chí đó.
// Mỗi dòng còn có `validationError`: null là hợp lệ, khác null là MẢNH lý do (ví dụ
// "phải là một trong: Bolero, Acoustic.") — ghép với `name` cùng dòng thành câu hiển thị.
// Trường này tính bằng ĐÚNG hàm mà lệnh ghi dùng để từ chối, nên nó là nguồn đúng; đừng tự viết
// lại phép so ở giao diện rồi tin bản của mình.
// Quyền đọc theo đúng quyền ghi: chủ phòng trà của chính buổi diễn, hoặc Admin.
export const getShowCustomValues = async (showId) => {
  return axiosClient.get(`/custom-criteria/shows/${showId}/values`);
};

// Gán giá trị tiêu chí cho một buổi diễn. Body là MẢNG TRẦN các cặp tiêu chí – giá trị,
// không phải object bọc ngoài. Gửi lại đầy đủ những gì muốn lưu.
export const setShowCustomValues = async (showId, values) => {
  return axiosClient.post(`/custom-criteria/shows/${showId}/values`, values);
};
