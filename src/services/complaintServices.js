
// KHÁCH CHƯA ĐĂNG NHẬP GỬI ĐƯỢC — khi đó phải để lại số điện thoại liên hệ.
export const createComplaint = async ({ targetType, targetId, category, description, evidenceUrls = null, contactPhone = null }) => {
  return axiosClient.post('/complaints', { targetType, targetId, category, description, evidenceUrls, contactPhone });
};

// Tra cứu bằng mã nhận được lúc gửi — dành cho người không có tài khoản.
// Backend trả CÙNG MỘT thông báo cho mã sai và mã không tồn tại (cố tình, để không thành công cụ dò mã),
// nên đừng cố phân biệt hai trường hợp đó trên giao diện.
export const lookupComplaint = async (reference) => {
  return axiosClient.get(`/complaints/lookup/${encodeURIComponent(reference)}`);
};

export const getMyComplaints = async (params = {}) => {
  return axiosClient.get('/complaints/my', { params });
};