import api from '../config/axios';

export const fnbService = {
  // ========== Menus ==========
  getMenus: (params) => api.get('/api/v1/fnb-menus', { params }).then(res => res.data),
  getMenuDetail: (id) => api.get(`/api/v1/fnb-menus/${id}`).then(res => res.data),
  createMenu: (data) => api.post('/api/v1/fnb-menus', data).then(res => res.data),
  // data: { loungeId, name, description, displayOrder, isActive }
  updateMenu: (id, data) => api.put(`/api/v1/fnb-menus/${id}`, data).then(res => res.data),
  deleteMenu: (id) => api.delete(`/api/v1/fnb-menus/${id}`).then(res => res.data),

  // ========== Menu Items ==========
  getMenuItems: (params) => api.get('/api/v1/fnb-menu-items', { params }).then(res => res.data),
  getMenuItemDetail: (id) => api.get(`/api/v1/fnb-menu-items/${id}`).then(res => res.data),
  createMenuItem: (data) => api.post('/api/v1/fnb-menu-items', data).then(res => res.data),
  // data: { menuId, category, name, description, price, imageUrl, displayOrder, isAvailable }
  updateMenuItem: (id, data) => api.put(`/api/v1/fnb-menu-items/${id}`, data).then(res => res.data),
  deleteMenuItem: (id) => api.delete(`/api/v1/fnb-menu-items/${id}`).then(res => res.data),

  // ========== Orders ==========
  createOrder: (data) => api.post('/api/v1/fnb-orders', data).then(res => res.data),
  // data: { loungeId, showId, zoneId, tableNote, paymentMethod, note, items }
  getOrders: (params) => api.get('/api/v1/fnb-orders', { params }).then(res => res.data),
  getMyOrders: (params) => api.get('/api/v1/fnb-orders/my', { params }).then(res => res.data),
  getOrderDetail: (id) => api.get(`/api/v1/fnb-orders/${id}`).then(res => res.data),
  updateOrderStatus: (id, status) =>
    api.put(`/api/v1/fnb-orders/${id}/status`, { status }).then(res => res.data),
};
