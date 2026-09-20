import axiosClient from '../config/axios';

// Hạng vé của 1 buổi diễn. Mỗi hạng vé chứa nhiều "đợt giá" (prices) — ví dụ vé sớm và vé thường
// cùng thuộc một hạng, khác nhau ở khoảng thời gian mở bán và mức giá.
export const getTiers = async (showId) => {
  return axiosClient.get('/ticket-tiers', { params: { showId } });
};

// accessType: 'Physical' (vào xem tại chỗ) hoặc 'Livestream' (xem trực tuyến) — backend chỉ nhận 2 giá trị này.
// prices[]: { name, price, quota, purchaseChannel, saleStart, saleEnd }
//   - price: số nguyên đồng, phải > 0 (backend có luật MustBeWholeDong, gửi số lẻ sẽ bị 400)
//   - purchaseChannel: 'Online' | 'Offline' | 'Both'
//   - saleEnd bỏ trống = bán tới khi buổi diễn kết thúc (BR-31)
// Phải có ít nhất 1 đợt giá, nếu không backend trả 400.
export const createTier = async (payload) => {
  return axiosClient.post('/ticket-tiers', payload);
};

// Chỉ sửa được tên, mô tả và sức chứa. Muốn đổi giá thì phải sửa qua đợt giá, không nằm ở đây.
export const updateTier = async (tierId, { name, description = null, totalCapacity = null }) => {
  return axiosClient.put(`/ticket-tiers/${tierId}`, { name, description, totalCapacity });
};

export const deleteTier = async (tierId) => {
  return axiosClient.delete(`/ticket-tiers/${tierId}`);
};
