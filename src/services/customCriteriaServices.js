import axiosClient from '../config/axios';

// Tiêu chí riêng của phòng trà: những thuộc tính chủ tự định nghĩa cho buổi diễn của mình
// (ví dụ "có phục vụ rượu", "độ ồn"), nằm ngoài danh mục chung do Admin quản.
// `key` là mã kỹ thuật để tra cứu, `name` là tên hiển thị. Đặt key rồi để nguyên — đổi key là
// mất liên kết với giá trị đã gán cho các buổi diễn cũ.
// `dataType` quyết định kiểu giá trị; với kiểu có danh sách chọn thì `options` là chuỗi các lựa chọn.
export const createCustomCriteria = async ({ loungeId, name, key, dataType, options = null }) => {
  return axiosClient.post('/custom-criteria', { loungeId, name, key, dataType, options });
};

export const getLoungeCustomCriteria = async (loungeId) => {
  return axiosClient.get('/custom-criteria', { params: { loungeId } });
};

// Đọc giá trị tiêu chí đã gán cho một buổi diễn. Trả về KÈM ĐỊNH NGHĨA tiêu chí
// ({criteriaId, name, key, dataType, options, criteriaIsActive, value}) nên không cần gọi thêm
// getLoungeCustomCriteria rồi tự ghép.
// TIÊU CHÍ ĐÃ TẮT VẪN ĐƯỢC TRẢ VỀ kèm criteriaIsActive=false — PHẢI hiện (mờ đi) chứ đừng lọc bỏ:
// thao tác ghi là THAY THẾ TOÀN BỘ, nên bỏ qua rồi lưu là xoá mất giá trị cũ của tiêu chí đó.
// Quyền đọc theo đúng quyền ghi: chủ phòng trà của chính buổi diễn, hoặc Admin.
export const getShowCustomValues = async (showId) => {
  return axiosClient.get(`/custom-criteria/shows/${showId}/values`);
};

// Gán giá trị tiêu chí cho một buổi diễn. Body là MẢNG TRẦN các cặp tiêu chí – giá trị,
// không phải object bọc ngoài. Gửi lại đầy đủ những gì muốn lưu.
export const setShowCustomValues = async (showId, values) => {
  return axiosClient.post(`/custom-criteria/shows/${showId}/values`, values);
};
