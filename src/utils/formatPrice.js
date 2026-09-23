// src/utils/formatPrice.js

export function formatMinPrice({ minPrice, maxPrice } = {}) {
  if (minPrice == null) return 'Chưa mở bán'
  if (minPrice === 0 && maxPrice === 0) return 'Miễn phí'
  return `${minPrice.toLocaleString('vi-VN')}đ`
}
