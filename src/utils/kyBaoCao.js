// src/utils/kyBaoCao.js
//
// MLACP-595: KỲ BÁO CÁO cho các trang phân tích của Admin (Tổng quan, Nội dung và tương tác). Hàm thuần để kiểm thử được.
//
// Chuẩn tham chiếu (research 04/10/2026):
//  - Shopify Analytics: danh sách khoảng định sẵn + lịch tự chọn; so với kỳ trước, kỳ trước vẽ nét đứt.
//  - Stripe Dashboard: khoảng định sẵn, đơn vị gộp tự đổi theo độ dài khoảng, kỳ so sánh.
// Ngày lưu dạng 'YYYY-MM-DD' theo GIỜ VIỆT NAM (đi lên URL qua nuqs). Gửi backend thì đổi thành mốc đầu ngày / cuối ngày
// +07:00 — backend tính mọi thứ theo giờ VN (VnOffset), gửi giờ UTC trần sẽ lệch 7 tiếng ở hai đầu khoảng.
import dayjs from 'dayjs'

const D = 'YYYY-MM-DD'
const ngay = (s) => dayjs(s, D)

// Khoảng định sẵn. `tinh(homNay)` trả { tu, den } (chuỗi ngày, cả hai đầu tính trọn ngày).
export const KHOANG_DINH_SAN = [
  { khoa: '7n', nhan: '7 ngày qua', tinh: (h) => ({ tu: h.subtract(6, 'day'), den: h }) },
  { khoa: '30n', nhan: '30 ngày qua', tinh: (h) => ({ tu: h.subtract(29, 'day'), den: h }) },
  { khoa: 'thang', nhan: 'Tháng này', tinh: (h) => ({ tu: h.startOf('month'), den: h }) },
  { khoa: 'thangTruoc', nhan: 'Tháng trước', tinh: (h) => ({ tu: h.subtract(1, 'month').startOf('month'), den: h.subtract(1, 'month').endOf('month') }) },
  { khoa: 'quy', nhan: 'Quý này', tinh: (h) => ({ tu: h.month(Math.floor(h.month() / 3) * 3).startOf('month'), den: h }) },
  { khoa: 'nam', nhan: 'Năm nay', tinh: (h) => ({ tu: h.startOf('year'), den: h }) },
  { khoa: '12t', nhan: '12 tháng qua', tinh: (h) => ({ tu: h.subtract(11, 'month').startOf('month'), den: h }) },
]

export const KY_MAC_DINH = '30n'

export const tinhKhoang = (khoa, homNay = dayjs()) => {
  const k = KHOANG_DINH_SAN.find((x) => x.khoa === khoa) ?? KHOANG_DINH_SAN.find((x) => x.khoa === KY_MAC_DINH)
  const { tu, den } = k.tinh(homNay.startOf('day'))
  return { tu: tu.format(D), den: den.format(D) }
}

// Khoảng hợp lệ: đủ hai đầu, đúng định dạng, tu ≤ den, không vượt hôm nay. Không hợp lệ → null (nơi gọi dùng mặc định).
export const khoangHopLe = (tu, den, homNay = dayjs()) => {
  if (!tu || !den || !ngay(tu).isValid() || !ngay(den).isValid()) return null
  const t = ngay(tu); const d = ngay(den)
  if (t.isAfter(d) || d.isAfter(homNay.endOf('day'))) return null
  return { tu: t.format(D), den: d.format(D) }
}

// Khoảng đang khớp đúng một khoảng định sẵn nào (để nút hiện "30 ngày qua" thay vì hai ngày) — không khớp thì null.
export const khoaDinhSanKhop = (tu, den, homNay = dayjs()) =>
  KHOANG_DINH_SAN.find((k) => { const r = tinhKhoang(k.khoa, homNay); return r.tu === tu && r.den === den })?.khoa ?? null

export const soNgayCua = (tu, den) => ngay(den).diff(ngay(tu), 'day') + 1

// KỲ TRƯỚC = cùng số ngày, liền ngay trước kỳ đang xem (cách Shopify gọi "Previous period").
export const kyTruoc = (tu, den) => {
  const n = soNgayCua(tu, den)
  return { tu: ngay(tu).subtract(n, 'day').format(D), den: ngay(tu).subtract(1, 'day').format(D) }
}

// Tham số gửi backend: đầu ngày `tu` và cuối ngày `den`, giờ VN.
export const thamSoApi = (tu, den) => ({
  from: `${tu}T00:00:00+07:00`,
  to: `${den}T23:59:59.999+07:00`,
})

export const nhanKhoang = (tu, den) => {
  const t = ngay(tu); const d = ngay(den)
  if (tu === den) return d.format('DD/MM/YYYY')
  return t.year() === d.year() ? `${t.format('DD/MM')} – ${d.format('DD/MM/YYYY')}` : `${t.format('DD/MM/YYYY')} – ${d.format('DD/MM/YYYY')}`
}

// Thay đổi so với kỳ trước, tính bằng phần trăm. Kỳ trước bằng 0 thì KHÔNG có phần trăm (chia cho 0 không có nghĩa) —
// trả null để giao diện ghi "kỳ trước chưa có" thay vì "+∞%".
export const phanTramDoi = (nay, truoc) => {
  const a = Number(nay || 0); const b = Number(truoc || 0)
  if (b === 0) return null
  return ((a - b) / Math.abs(b)) * 100
}

export const cauSoVoiKyTruoc = (nay, truoc) => {
  const p = phanTramDoi(nay, truoc)
  if (p === null) return Number(nay || 0) === 0 ? 'Kỳ trước cũng chưa có' : 'Kỳ trước chưa có'
  if (Math.abs(p) < 0.05) return 'Bằng kỳ trước'
  const so = Math.abs(p).toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  return `${p > 0 ? 'Tăng' : 'Giảm'} ${so}% so với kỳ trước`
}
