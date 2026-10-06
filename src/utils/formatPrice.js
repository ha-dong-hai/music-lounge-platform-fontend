// src/utils/formatPrice.js
//
// Không import i18n ở đây để file vẫn chạy thẳng bằng node (formatPrice.test.mjs).
// Component truyền ngôn ngữ hiện tại vào: formatMinPrice(show, i18n.language). Mặc định 'vi'.

const NHAN = {
  vi: { notOnSale: 'Chưa mở bán', free: 'Miễn phí' },
  en: { notOnSale: 'Not on sale yet', free: 'Free' },
}

export function formatMinPrice({ minPrice, maxPrice } = {}, lang = 'vi') {
  const nhan = NHAN[lang] || NHAN.vi
  if (minPrice == null) return nhan.notOnSale
  if (minPrice === 0 && maxPrice === 0) return nhan.free
  return lang === 'en'
    ? `${minPrice.toLocaleString('en-US')} VND`
    : `${minPrice.toLocaleString('vi-VN')}đ`
}
