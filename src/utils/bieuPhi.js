// src/utils/bieuPhi.js — hàm thuần cho BIỂU PHÍ VÀ ĐIỀU KHOẢN TIỀN (MLACP-626). Tách khỏi component để test bằng node
// (bieuPhi.test.mjs).
//
// Mọi con số lấy từ GET /catalog/money-terms (backend MLACP-625) — KHÔNG gõ cứng tỉ lệ ở web: Admin đổi được qua trang
// cấu hình, và cùng ngày 04/10/2026 phần nghệ sĩ nhận từ tiền ủng hộ vừa đổi 88% → 86%.

export const dong = (v) => `${Math.round(Number(v || 0)).toLocaleString('vi-VN')}đ`

// 0.05 → "5%", 0.125 → "12,5%"
export const phanTram = (r) => `${(Number(r || 0) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`

// 72 → "72 giờ (3 ngày)"; 20 → "20 giờ". Người đọc nghĩ theo ngày, hệ thống tính theo giờ — in cả hai khi chia hết.
export const gioVaNgay = (gio) => {
  const g = Number(gio || 0)
  return g >= 48 && g % 24 === 0 ? `${g} giờ (${g / 24} ngày)` : `${g} giờ`
}

// Chia một khoản ủng hộ theo biểu phí. VND không có đơn vị lẻ: mỗi phần làm tròn tới đồng, phần phòng trà giữ lại là
// PHẦN CÒN LẠI nên năm dòng luôn cộng đúng bằng số khán giả trả.
export const chiaUngHo = (dk, soTien) => {
  const t = Math.max(0, Math.round(Number(soTien || 0)))
  const ngheSi = Math.round(t * dk.performerShareRate)
  const phi = Math.round(t * dk.platformCommissionRate)
  const gtgt = Math.round(t * dk.vatRate)
  const tncn = Math.round(t * dk.personalIncomeTaxRate)
  return { tong: t, ngheSi, phi, gtgt, tncn, phongTra: t - ngheSi - phi - gtgt - tncn }
}

// Chia tiền một vé trực tuyến cho phòng trà là hộ/cá nhân kinh doanh, và tách hai đợt chi.
export const chiaVe = (ve, lichChi, giaVe, tiLeDot1) => {
  const t = Math.max(0, Math.round(Number(giaVe || 0)))
  const phi = Math.round(t * ve.platformCommissionRate)
  const gtgt = Math.round(t * ve.vatRate)
  const tncn = Math.round(t * ve.personalIncomeTaxRate)
  const nhan = t - phi - gtgt - tncn
  const dot1 = Math.round(nhan * (tiLeDot1 ?? lichChi.newVenueFirstTrancheRate))
  return { tong: t, phi, gtgt, tncn, nhan, dot1, dotCuoi: nhan - dot1 }
}

// Nhật ký thay đổi: khoá cấu hình → nhãn tiếng Việt + cách in giá trị. Khoá lạ (backend thêm sau) vẫn in được: nhãn là
// chính khoá, giá trị in nguyên — thà thô còn hơn giấu một thay đổi về tiền.
const TI_LE = phanTram
const GIO = (v) => `${v} giờ`
const NGAY = (v) => `${v} ngày`
const PHUT = (v) => `${v} phút`
const NGUYEN = (v) => String(v)
const NHAN_KHOA = {
  platform_commission_rate: ['Phí nền tảng', TI_LE],
  tax_rate: ['Thuế GTGT khấu trừ', TI_LE],
  personal_income_tax_rate: ['Thuế TNCN khấu trừ', TI_LE],
  ticket_hold_minutes: ['Thời gian giữ chỗ', PHUT],
  ticket_hold_max_quantity: ['Số vé tối đa một lần giữ chỗ', (v) => `${v} vé`],
  walkin_commission_enabled: ['Vé tại quầy đi qua nền tảng', (v) => (String(v).toLowerCase() === 'true' ? 'Có' : 'Không')],
  refund_sla_hours: ['Hạn xử lý yêu cầu hoàn tiền', GIO],
  refund_auto_approve_grace_hours: ['Khoảng chờ trước khi tự duyệt hoàn tiền', GIO],
  vnpay_refund_window_days: ['Hạn hoàn về phương thức đã trả', NGAY],
  donation_performer_share_rate: ['Phần nghệ sĩ nhận từ tiền ủng hộ', TI_LE],
  donation_hold_days: ['Hạn phòng trà chuyển tiền ủng hộ cho nghệ sĩ', NGAY],
  donation_max_amount: ['Mức ủng hộ tối đa một lần', dong],
  settlement_partial_hours_after_show: ['Đợt chi 1 sau buổi diễn', GIO],
  settlement_final_days_after_show: ['Đợt chi cuối sau buổi diễn', NGAY],
  settlement_tier_new_pre_rate: ['Tỉ lệ đợt 1 — phòng trà mới', TI_LE],
  settlement_tier_standard_pre_rate: ['Tỉ lệ đợt 1 — hạng chuẩn', TI_LE],
  settlement_tier_premium_pre_rate: ['Tỉ lệ đợt 1 — hạng cao', TI_LE],
  settlement_tier_standard_min_score: ['Điểm đánh giá tối thiểu của hạng chuẩn', NGUYEN],
  settlement_tier_premium_min_score: ['Điểm đánh giá tối thiểu của hạng cao', NGUYEN],
  settlement_tier_premium_min_shows: ['Số buổi tối thiểu của hạng cao', (v) => `${v} buổi`],
}

export const dienGiaiThayDoi = (c) => {
  const [nhan, inRa] = NHAN_KHOA[c.key] ?? [c.key, NGUYEN]
  return { nhan, cu: c.oldValue == null ? '—' : inRa(c.oldValue), moi: inRa(c.newValue), luc: c.effectiveFrom }
}
