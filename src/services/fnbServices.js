import axiosClient from '../config/axios';

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


// Đơn của chính người đang đăng nhập
export const getMyFnbOrders = async (params = {}) => {
  return axiosClient.get('/fnb-orders/my', { params });
};

// Chuyển sang trả online: trả về paymentUrl của VNPay để chuyển hướng trình duyệt.
export const payFnbOrder = async (id) => {
  return axiosClient.post(`/fnb-orders/${id}/pay`);
};