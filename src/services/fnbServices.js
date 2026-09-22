import axiosClient from '../config/axios';

// Thực đơn của 1 phòng trà (mỗi phòng trà có thể có nhiều thực đơn: đồ uống, món ăn nhẹ...).
export const getMenus = async (loungeId) => {
  return axiosClient.get('/fnb-menus', { params: { loungeId } });
};

// Món trong 1 thực đơn.
export const getMenuItems = async (menuId) => {
  return axiosClient.get('/fnb-menu-items', { params: { menuId } });
};

// Tạo đơn. LƯU Ý: paymentMethod lúc tạo BẮT BUỘC là 'Cash' — backend từ chối 'Gateway' ở bước này
// vì chưa có bản ghi Payment nào. Muốn trả online thì tạo đơn xong gọi payFnbOrder() bên dưới,
// chính endpoint đó mới đổi PaymentMethod sang Gateway khi VNPay xác nhận.
// items: [{menuItemId, quantity, note}]
export const createFnbOrder = async ({ loungeId, showId = null, zoneId = null, tableNote = null, note = null, items }) => {
  return axiosClient.post('/fnb-orders', {
    loungeId, showId, zoneId, tableNote, paymentMethod: 'Cash', note, items,
  });
};

// Đơn của chính người đang đăng nhập, mới nhất trước.
// Mỗi đơn có status (bếp làm tới đâu) TÁCH BIỆT với isPaid (đã trả tiền chưa) — đừng suy cái này
// ra từ cái kia. onlinePaymentLiveUntil khác null nghĩa là đang có link VNPay còn hiệu lực.
export const getMyFnbOrders = async (params = {}) => {
  return axiosClient.get('/fnb-orders/my', { params });
};

// Hàng đợi đơn của venue (Staff/Owner), lọc theo trạng thái. Sắp mới nhất trước.
export const getLoungeFnbOrders = async (loungeId, params = {}) => {
  return axiosClient.get('/fnb-orders', { params: { loungeId, ...params } });
};

// Staff/Owner đổi trạng thái chế biến của đơn.
export const updateFnbOrderStatus = async (id, status) => {
  return axiosClient.put(`/fnb-orders/${id}/status`, { status });
};

// Chuyển sang trả online: trả về paymentUrl của VNPay để chuyển hướng trình duyệt.
export const payFnbOrder = async (id) => {
  return axiosClient.post(`/fnb-orders/${id}/pay`);
};

// ===== QUẢN LÝ THỰC ĐƠN (chủ phòng trà) =====
// Một phòng trà có nhiều thực đơn (ví dụ "Đồ uống", "Đồ ăn nhẹ"), mỗi thực đơn có nhiều món.
// displayOrder quyết định thứ tự khách nhìn thấy — số nhỏ lên trước.

export const createMenu = async ({ loungeId, name, description = null, displayOrder = 0 }) => {
  return axiosClient.post('/fnb-menus', { loungeId, name, description, displayOrder });
};

// PUT ghi đè — phải gửi lại đủ cả isActive và displayOrder, bỏ trống là mất giá trị cũ.
export const updateMenu = async (id, { name, description = null, isActive, displayOrder }) => {
  return axiosClient.put(`/fnb-menus/${id}`, { menuId: id, name, description, isActive, displayOrder });
};

export const deleteMenu = async (id) => {
  return axiosClient.delete(`/fnb-menus/${id}`);
};

export const createMenuItem = async ({ menuId, category, name, description = null, price, imageUrl = null, displayOrder = 0 }) => {
  return axiosClient.post('/fnb-menu-items', { menuId, category, name, description, price, imageUrl, displayOrder });
};

// isAvailable = còn bán hay tạm hết. Tắt cái này thay vì xoá món, để đơn cũ vẫn tra cứu được tên món.
export const updateMenuItem = async (id, { category, name, description = null, price, imageUrl = null, isAvailable, displayOrder }) => {
  return axiosClient.put(`/fnb-menu-items/${id}`, { category, name, description, price, imageUrl, isAvailable, displayOrder });
};

export const deleteMenuItem = async (id) => {
  return axiosClient.delete(`/fnb-menu-items/${id}`);
};
