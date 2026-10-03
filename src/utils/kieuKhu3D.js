// src/utils/kieuKhu3D.js — kiểu bàn ghế dựng trong sơ đồ chỗ ngồi 3D (SoDoCho3D), đoán theo TÊN khu chủ phòng trà đặt.
// Tách khỏi component để test bằng node (kieuKhu3D.test.mjs). Thứ tự xét CÓ NGHĨA — xem chú thích đầu SoDoCho3D.jsx:
// "Hàng A–C VIP" phải ra hàng ghế (không phải bàn VIP), "Sofa cạnh bar" ra quầy bar.
// `\b` của JS chỉ hiểu chữ ASCII, nên từ có dấu tiếng Việt so khớp thẳng; "bar" và "vip" giữ \b để "Minibar" không khớp.
export const kieuKhu = (ten = '') => {
  const t = String(ten).toLowerCase()
  if (/\bbar\b|quầy/.test(t)) return 'bar'
  if (/sofa/.test(t)) return 'sofa'
  if (/hàng|khán phòng|rạp/.test(t)) return 'hang'
  if (/đôi|cặp/.test(t)) return 'doi'
  if (/nhóm|tiệc|bàn dài|gia đình/.test(t)) return 'nhom'
  if (/\bvip\b/.test(t)) return 'vip'
  return 'ban'
}
