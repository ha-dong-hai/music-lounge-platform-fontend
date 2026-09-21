// src/utils/formatPrice.js
//
// GHI CHÚ CHO ĐỘI FE — nhãn giá "từ ..." của một buổi diễn ở MỌI danh sách (trang chủ, tìm kiếm, phòng
// trà, yêu thích, đêm diễn tương tự). Trước đây mỗi nơi tự viết `show.minPrice.toLocaleString(...)`, mà
// buổi diễn CHƯA MỞ BÁN hạng vé nào thì minPrice/maxPrice là null -> ném TypeError và làm sập CẢ TRANG
// (trang chi tiết phòng trà số 2 không mở được vì đúng lỗi này). Một hàm chung để không ai quên chặn null.
export function formatMinPrice({ minPrice, maxPrice } = {}) {
  if (minPrice == null) return 'Chưa mở bán'
  if (minPrice === 0 && maxPrice === 0) return 'Miễn phí'
  return `${minPrice.toLocaleString('vi-VN')}đ`
}
