// src/i18n/format.js
// Định dạng tiền / số theo ngôn ngữ đang chọn. Tiền vẫn là VND (nền tảng chỉ bán bằng VND) —
// chỉ đổi cách viết: vi "350.000đ", en "350,000 VND".
import i18n, { currentLocale } from './index'

export const formatNumber = (v, options) => Number(v || 0).toLocaleString(currentLocale(), options)

export const formatMoney = (v) =>
  i18n.language === 'en' ? `${formatNumber(v)} VND` : `${formatNumber(v)}đ`
