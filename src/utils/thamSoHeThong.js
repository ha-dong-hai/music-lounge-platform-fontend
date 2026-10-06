// src/utils/thamSoHeThong.js
//
// BẢNG TRA THAM SỐ HỆ THỐNG cho trang Admin "Cấu hình hệ thống" (03/10/2026). Chủ dự án: "khó sử dụng quá, không hiểu gì
// hết, không phù hợp với người mới". Đo trên 32 tham số thật: tên hiện ra là khoá kỹ thuật (`settlement_tier_new_pre_rate`),
// giá trị in thô (`0.05` thay vì 5%, `true`, `[]`, số giờ không kèm đơn vị), ô sửa là ô chữ trống ghi "kiểu Decimal", 26 mục
// dồn vào một nhóm "Tham số khác", mô tả trích mã nội bộ (§6.17, D3).
//
// Bảng này chỉ là LỚP HIỂN THỊ: tên đời thường, nhóm theo việc, đơn vị, cách nhập. Giá trị gửi lên vẫn đúng dạng backend
// nhận (Decimal dấu chấm "0.05", Boolean "true"/"false", Json mảng chuỗi) — `guiLen` đổi về đúng dạng đó.
// Căn cứ: GOV.UK Design System (text input) "Use prefixes and suffixes to help users enter things like currencies and
// measurements"; inputmode numeric/decimal thay cho type="number". NN/g progressive disclosure: thứ hay dùng lên trước.
//
// Luật kiểm ở đây CHỈ LÀ BẢN SAO TRƯỚC của backend (SystemConfigValidation.cs) để báo sớm, bằng lời dễ hiểu:
// số nguyên > 0, tỉ lệ 0–100%, không âm. Ràng buộc chéo giữa các tỉ lệ tiền vẫn do backend quyết — lỗi của nó hiện nguyên văn.
// Khoá mới chưa có trong bảng vẫn hiện được (rơi về nhóm "Khác", tên = khoá) — không giấu tham số nào.

export const NHOM = [
  { id: 've', ten: 'Vé và giữ chỗ', moTa: 'Khách mua vé, giữ chỗ, vào cửa, chuyển nhượng và đánh giá sau buổi diễn.' },
  { id: 'lich', ten: 'Lịch diễn', moTa: 'Ràng buộc khi phòng trà đăng hoặc dời lịch buổi hòa nhạc.' },
  { id: 'phi', ten: 'Hoa hồng và thuế', moTa: 'Phần nền tảng và nhà nước giữ lại trên mỗi khoản tiền bán vé.' },
  { id: 'chiTra', ten: 'Chi trả cho phòng trà', moTa: 'Khi nào và bao nhiêu tiền vé được chuyển cho phòng trà sau buổi diễn.' },
  { id: 'ungHo', ten: 'Tiền ủng hộ nghệ sĩ', moTa: 'Khán giả ủng hộ (donate) nghệ sĩ trong buổi diễn.' },
  { id: 'xuLy', ten: 'Thời hạn xử lý của quản trị', moTa: 'Khiếu nại, kiểm duyệt nội dung, kháng cáo và án phạt.' },
  { id: 'khac', ten: 'Khác', moTa: '' },
]

// kieu: 'tile' (lưu 0–1, nhập %) · 'so' (số nguyên > 0) · 'thapPhan' (số thập phân ≥ 0) · 'tien' (VNĐ nguyên) ·
//       'bat' (Bật/Tắt) · 'dsTu' (danh sách từ, lưu mảng JSON) · 'chu'
const THAM_SO = {
  // ---- Vé và giữ chỗ
  ticket_hold_minutes: { nhom: 've', ten: 'Thời gian giữ chỗ khi thanh toán', kieu: 'so', donVi: 'phút', moTa: 'Khách bấm mua thì chỗ được giữ trong khoảng này; quá hạn chưa trả tiền thì chỗ được nhả cho người khác.' },
  ticket_hold_max_quantity: { nhom: 've', ten: 'Số vé tối đa mỗi lần mua online', kieu: 'so', donVi: 'vé', moTa: 'Chặn một người gom vé để bán lại.' },
  walkin_ticket_max_quantity: { nhom: 've', ten: 'Số vé tối đa mỗi lần bán tại quầy', kieu: 'so', donVi: 'vé', moTa: 'Giới hạn cho nhân viên bán vé trực tiếp tại phòng trà.' },
  ticket_last_entry_minutes: { nhom: 've', ten: 'Ngừng bán vé trước khi buổi diễn kết thúc', kieu: 'so', donVi: 'phút', moTa: 'Buổi diễn còn ít hơn số phút này thì không bán vé nữa — khách tới nơi cũng không kịp nghe.' },
  ticket_transfer_expiry_hours: { nhom: 've', ten: 'Hạn trả lời lời mời nhận vé chuyển nhượng', kieu: 'so', donVi: 'giờ', moTa: 'Người được tặng/chuyển vé không trả lời trong khoảng này thì yêu cầu tự huỷ, vé về lại người gửi.' },
  rating_window_days: { nhom: 've', ten: 'Thời gian khán giả còn được đánh giá', kieu: 'so', donVi: 'ngày', moTa: 'Tính từ lúc buổi diễn kết thúc.' },
  // ---- Lịch diễn
  publish_min_business_days_lead_time: { nhom: 'lich', ten: 'Đăng lịch trước ngày diễn ít nhất', kieu: 'so', donVi: 'ngày làm việc', moTa: 'Phòng trà phải đăng (hoặc dời) buổi diễn sớm ít nhất chừng này ngày làm việc — theo Nghị định 144/2020, Điều 10.' },
  venue_changeover_minutes: { nhom: 'lich', ten: 'Khoảng nghỉ giữa hai buổi diễn liền nhau', kieu: 'so', donVi: 'phút', moTa: 'Ở cùng một phòng trà, để tiễn khán giả buổi trước và đón khán giả buổi sau.' },
  // ---- Hoa hồng và thuế
  platform_commission_rate: { nhom: 'phi', ten: 'Hoa hồng nền tảng', kieu: 'tile', moTa: 'Phần MusicLounge giữ lại trên mỗi vé bán online.', viDu: (v) => `Vé 200.000đ → nền tảng giữ ${dong(200000 * v)}` },
  tax_rate: { nhom: 'phi', ten: 'Thuế GTGT khấu trừ tại nguồn', kieu: 'tile', moTa: 'Chỉ khấu trừ với phòng trà là hộ/cá nhân kinh doanh — Nghị định 117/2025 quy định 5% cho dịch vụ.', viDu: (v) => `Vé 200.000đ → khấu trừ ${dong(200000 * v)}` },
  personal_income_tax_rate: { nhom: 'phi', ten: 'Thuế thu nhập cá nhân khấu trừ tại nguồn', kieu: 'tile', // MLACP-691: câu cũ "Đang để 0% có chủ đích…" sai từ 04/10/2026 — tham số đã đổi 0 → 0.02 (system_config_history) và vé
  // bán từ đó bị khấu trừ 2% thật. Mô tả không được khẳng định giá trị hiện tại (giá trị nằm ngay ô bên cạnh) — chỉ nói luật.
  moTa: 'Chỉ khấu trừ với phòng trà là hộ/cá nhân kinh doanh (doanh nghiệp đã được xác minh tự khai thuế) — Nghị định 117/2025 quy định 2% với cá nhân cư trú. Trừ vào phần phòng trà nhận.', viDu: (v) => `Vé 200.000đ → khấu trừ ${dong(200000 * v)}` },
  // ---- Chi trả cho phòng trà
  settlement_partial_hours_after_show: { nhom: 'chiTra', ten: 'Chi trả đợt đầu sau buổi diễn', kieu: 'so', donVi: 'giờ', moTa: 'Bao lâu sau khi buổi diễn kết thúc thì chuyển đợt đầu cho phòng trà. Tỉ lệ đợt đầu tuỳ hạng phòng trà (bên dưới).' },
  settlement_final_days_after_show: { nhom: 'chiTra', ten: 'Chi trả phần còn lại sau buổi diễn', kieu: 'so', donVi: 'ngày', moTa: 'Khoảng chờ để khách kịp khiếu nại trước khi chuyển nốt tiền.' },
  settlement_completion_threshold_pct: { nhom: 'chiTra', ten: 'Buổi diễn phải diễn đủ ít nhất', kieu: 'tile', moTa: 'So thời lượng diễn thật với lịch. Thấp hơn mức này thì phần còn lại KHÔNG tự chi trả mà chờ Admin xem xét.' },
  settlement_tier_new_pre_rate: { nhom: 'chiTra', ten: 'Đợt đầu — phòng trà hạng Mới', kieu: 'tile', moTa: 'Phòng trà điểm uy tín dưới mức hạng Chuẩn, hoặc chưa đủ 3 buổi diễn.', viDu: (v) => `Bán 10.000.000đ → đợt đầu nhận ${dong(10000000 * v)}` },
  settlement_tier_standard_pre_rate: { nhom: 'chiTra', ten: 'Đợt đầu — phòng trà hạng Chuẩn', kieu: 'tile', moTa: 'Phòng trà đạt điểm uy tín hạng Chuẩn.', viDu: (v) => `Bán 10.000.000đ → đợt đầu nhận ${dong(10000000 * v)}` },
  settlement_tier_premium_pre_rate: { nhom: 'chiTra', ten: 'Đợt đầu — phòng trà hạng Premium', kieu: 'tile', moTa: 'Phòng trà đạt cả điểm và số buổi hạng Premium.', viDu: (v) => `Bán 10.000.000đ → đợt đầu nhận ${dong(10000000 * v)}` },
  settlement_tier_standard_min_score: { nhom: 'chiTra', ten: 'Điểm uy tín để lên hạng Chuẩn', kieu: 'thapPhan', donVi: 'điểm', moTa: 'Thang 5 điểm, từ đánh giá của khán giả.' },
  settlement_tier_premium_min_score: { nhom: 'chiTra', ten: 'Điểm uy tín để lên hạng Premium', kieu: 'thapPhan', donVi: 'điểm', moTa: 'Thang 5 điểm. Cần thêm đủ số buổi diễn bên dưới.' },
  settlement_tier_premium_min_shows: { nhom: 'chiTra', ten: 'Số buổi diễn để lên hạng Premium', kieu: 'so', donVi: 'buổi', moTa: 'Số buổi diễn đã hoàn tất.' },
  // ---- Tiền ủng hộ nghệ sĩ
  donation_performer_share_rate: { nhom: 'ungHo', ten: 'Phần nghệ sĩ nhận từ tiền ủng hộ', kieu: 'tile', moTa: 'Phần còn lại là hoa hồng, thuế và phần phòng trà.', viDu: (v) => `Ủng hộ 100.000đ → nghệ sĩ nhận ${dong(100000 * v)}` },
  donation_hold_days: { nhom: 'ungHo', ten: 'Hạn phòng trà chuyển tiền ủng hộ cho nghệ sĩ', kieu: 'so', donVi: 'ngày', moTa: 'Tính từ lúc phòng trà nhận tiền. Quá hạn mà chưa xác nhận đã chuyển thì hệ thống nhắc và báo Admin.' },
  donation_max_amount: { nhom: 'ungHo', ten: 'Số tiền tối đa mỗi lần ủng hộ', kieu: 'tien', moTa: 'Chặn gian lận và rửa tiền qua tiền ủng hộ.' },
  donation_message_blocked_words: { nhom: 'ungHo', ten: 'Từ cấm trong lời nhắn ủng hộ', kieu: 'dsTu', moTa: 'Lời nhắn chứa một trong các từ này sẽ không hiện trên màn phát trực tiếp. Mỗi dòng một từ hoặc cụm từ.' },
  // ---- Thời hạn xử lý của quản trị
  complaint_sla_hours: { nhom: 'xuLy', ten: 'Hạn giải quyết khiếu nại', kieu: 'so', donVi: 'giờ', moTa: 'Mục tiêu vận hành để Admin giải quyết khiếu nại của khách.' },
  moderation_sla_hours: { nhom: 'xuLy', ten: 'Hạn xử lý nội dung bị gắn cờ', kieu: 'so', donVi: 'giờ', moTa: 'Bài/ảnh/lời bình bị báo cáo hoặc AI gắn cờ — theo Nghị định 147/2024.' },
  appeal_sla_hours: { nhom: 'xuLy', ten: 'Hạn xem xét đơn kháng cáo án phạt', kieu: 'so', donVi: 'giờ', moTa: 'Phòng trà kháng cáo án phạt thì Admin phải xem trong khoảng này.' },
  appeal_auto_approve: { nhom: 'xuLy', ten: 'Tự chấp nhận kháng cáo khi Admin trễ hạn', kieu: 'bat', moTa: 'Bật: quá hạn mà Admin chưa xử lý thì đơn kháng cáo được chấp nhận, để phòng trà không chịu thiệt vì Admin chậm.' },
  penalty_ban_notice_days: { nhom: 'xuLy', ten: 'Báo trước khi cấm hoạt động', kieu: 'so', donVi: 'ngày', moTa: 'Án cấm hoạt động chỉ có hiệu lực sau khoảng báo trước này.' },
  penalty_suspension_notice_hours: { nhom: 'xuLy', ten: 'Báo trước khi tạm đình chỉ', kieu: 'so', donVi: 'giờ', moTa: 'Án tạm đình chỉ chỉ có hiệu lực sau khoảng báo trước này.' },
  // ---- Khác
  ai_poster_max_attempts_per_show: { nhom: 'khac', ten: 'Số lần tạo poster bằng AI cho mỗi buổi diễn', kieu: 'so', donVi: 'lần', moTa: 'Tính cả lần tạo lỗi. Giới hạn chi phí gọi AI.' },
  current_terms_version: { nhom: 'khac', ten: 'Phiên bản Điều khoản sử dụng đang áp dụng', kieu: 'chu', moTa: 'Người đăng ký mới đồng ý theo phiên bản này. Đổi khi công bố điều khoản mới.' },
}

const KIEU_THEO_DATA_TYPE = { Integer: 'so', Decimal: 'thapPhan', Boolean: 'bat', Json: 'chu', String: 'chu' }

function dong(n) {
  return `${Math.round(n).toLocaleString('vi-VN')}đ`
}

// Số kiểu Việt: 4,2 · 50.000.000 — bỏ số 0 thừa của phép nhân thập phân (0.07*100 = 7.000000000000001).
function soViet(n, toiDaLe = 2) {
  return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: toiDaLe })
}

/** Siêu dữ liệu hiển thị của một tham số; khoá lạ thì suy từ dataType. */
export function moTaThamSo(c) {
  const m = THAM_SO[c.configKey]
  if (m) return { ...m, khoa: c.configKey }
  const kieu = c.isMoneyRate ? 'tile' : (KIEU_THEO_DATA_TYPE[c.dataType] ?? 'chu')
  return { nhom: 'khac', ten: c.configKey, kieu, moTa: c.description ?? '', khoa: c.configKey }
}

/** Giá trị để ĐỌC: "15 phút", "5%", "Bật", "3 từ", "50.000.000đ". */
export function hienGiaTri(m, raw) {
  const s = String(raw ?? '')
  switch (m.kieu) {
    case 'tile': return Number.isFinite(Number(s)) ? `${soViet(Number(s) * 100)}%` : s
    case 'so':
    case 'thapPhan': return Number.isFinite(Number(s)) ? `${soViet(Number(s))}${m.donVi ? ` ${m.donVi}` : ''}` : s
    case 'tien': return Number.isFinite(Number(s)) ? dong(Number(s)) : s
    case 'bat': return s === 'true' ? 'Bật' : s === 'false' ? 'Tắt' : s
    case 'dsTu': {
      const ds = docDsTu(s)
      if (!ds) return s
      return ds.length === 0 ? 'Chưa có từ nào' : `${ds.length} từ: ${ds.slice(0, 3).join(', ')}${ds.length > 3 ? '…' : ''}`
    }
    default: return s
  }
}

function docDsTu(s) {
  try { const a = JSON.parse(s); return Array.isArray(a) && a.every((x) => typeof x === 'string') ? a : null } catch { return null }
}

/** Giá trị đưa vào Ô SỬA: tỉ lệ → phần trăm ("5"), thập phân dùng dấu phẩy ("4,2"), danh sách từ → mỗi dòng một từ. */
export function giaTriSua(m, raw) {
  const s = String(raw ?? '')
  switch (m.kieu) {
    case 'tile': return Number.isFinite(Number(s)) ? String(Number((Number(s) * 100).toFixed(4))).replace('.', ',') : s
    case 'thapPhan': return s.replace('.', ',')
    case 'dsTu': return (docDsTu(s) ?? []).join('\n')
    default: return s
  }
}

const docSo = (s) => {
  const t = String(s).trim().replace(/\s/g, '')
  if (!/^\d+([.,]\d+)?$/.test(t)) return null
  return Number(t.replace(',', '.'))
}

/**
 * Đổi chữ trong ô sửa về đúng dạng backend nhận.
 * @returns {{ ok: true, value: string } | { ok: false, loi: string }}
 */
export function guiLen(m, nhap) {
  const s = String(nhap ?? '').trim()
  switch (m.kieu) {
    case 'tile': {
      const n = docSo(s)
      if (n === null) return { ok: false, loi: 'Nhập một số phần trăm, ví dụ 5 hoặc 2,5.' }
      if (n > 100) return { ok: false, loi: 'Tỉ lệ không được vượt quá 100%.' }
      return { ok: true, value: String(Number((n / 100).toFixed(6))) }
    }
    case 'so': {
      if (!/^\d+$/.test(s.replace(/[.\s]/g, ''))) return { ok: false, loi: 'Nhập một số nguyên, ví dụ 15.' }
      const n = Number(s.replace(/[.\s]/g, ''))
      if (n <= 0) return { ok: false, loi: 'Giá trị phải lớn hơn 0.' }
      return { ok: true, value: String(n) }
    }
    case 'thapPhan': {
      const n = docSo(s)
      if (n === null) return { ok: false, loi: 'Nhập một số, ví dụ 4,2.' }
      return { ok: true, value: String(n) }
    }
    case 'tien': {
      const t = s.replace(/[.\s,đ]/gi, '')
      if (!/^\d+$/.test(t) || Number(t) <= 0) return { ok: false, loi: 'Nhập số tiền, ví dụ 50.000.000.' }
      return { ok: true, value: String(Number(t)) }
    }
    case 'bat': return s === 'true' || s === 'false' ? { ok: true, value: s } : { ok: false, loi: 'Chọn Bật hoặc Tắt.' }
    case 'dsTu': {
      const ds = [...new Set(s.split('\n').map((x) => x.trim()).filter(Boolean))]
      return { ok: true, value: JSON.stringify(ds) }
    }
    default:
      return s ? { ok: true, value: s } : { ok: false, loi: 'Giá trị không được để trống.' }
  }
}

/** Gom danh sách tham số theo nhóm, giữ thứ tự nhóm trong NHOM và thứ tự khai báo trong bảng. Bỏ nhóm rỗng. */
export function gomTheoNhom(ds) {
  const thuTu = Object.keys(THAM_SO)
  const viTri = (k) => { const i = thuTu.indexOf(k); return i === -1 ? Number.MAX_SAFE_INTEGER : i }
  return NHOM.map((n) => ({
    ...n,
    muc: ds.map((c) => ({ c, m: moTaThamSo(c) })).filter((x) => x.m.nhom === n.id)
      .sort((a, b) => viTri(a.c.configKey) - viTri(b.c.configKey) || a.c.configKey.localeCompare(b.c.configKey)),
  })).filter((n) => n.muc.length > 0)
}

/** Lọc theo ô tìm: khớp tên, mô tả, khoá kỹ thuật — không phân biệt dấu. */
export function khopTim(m, c, q) {
  const bo = (x) => String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
  const t = bo(q).trim()
  if (!t) return true
  return [m.ten, m.moTa, c.configKey, c.description].some((x) => bo(x).includes(t))
}
