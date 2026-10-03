// src/utils/formatPrice.js
import { td } from '../i18n/k.js'

export function formatMinPrice({ minPrice, maxPrice } = {}) {
  if (minPrice == null) return td('Chưa mở bán')
  if (minPrice === 0 && maxPrice === 0) return td('Miễn phí')
  return `${minPrice.toLocaleString('vi-VN')}đ`
}
