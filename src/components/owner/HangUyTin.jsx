// src/components/owner/HangUyTin.jsx — MLACP-671: hạng uy tín của phòng trà (GET /me/earnings → standings).
//
// VÌ SAO: hạng quyết định phần tiền vé chuyển TRƯỚC cho phòng trà ở đợt 1 (Mới / Tiêu chuẩn / Cao cấp), nhưng trước đây chủ
// phòng trà không thấy mình hạng nào, vì sao nhận trước 50% chứ không phải 70%. Mọi con số (tỉ lệ, ngưỡng) lấy từ backend
// (`rules`, đọc system_config) — KHÔNG viết cứng ở đây, Admin đổi cấu hình thì màn này đổi theo.
// Đây KHÔNG phải tỉ lệ hoàn tiền cho khách.
import { Award } from 'lucide-react'

const TEN_HANG = { New: 'Mới', Standard: 'Tiêu chuẩn', Premium: 'Cao cấp' }
const phanTram = (r) => `${Math.round(Number(r) * 100)}%`
const diem = (d) => Number(d).toLocaleString('vi-VN', { maximumFractionDigits: 2 })

// Câu "cần gì để lên hạng" — nói đúng phần còn thiếu, không liệt kê lại cả luật.
const buocTiep = (s) => {
  const r = s.rules
  if (s.tier === 'Premium') return 'Đây là hạng cao nhất.'
  if (s.tier === 'Standard') {
    const thieu = []
    if (Number(s.score) < Number(r.premiumMinScore)) thieu.push(`điểm trung bình từ ${diem(r.premiumMinScore)}`)
    if (s.completedShows < r.premiumMinShows) thieu.push(`thêm ${r.premiumMinShows - s.completedShows} buổi diễn đã kết thúc`)
    return `Lên Cao cấp (nhận trước ${phanTram(r.premiumPreRate)}): cần ${thieu.join(' và ')}.`
  }
  return `Lên Tiêu chuẩn (nhận trước ${phanTram(r.standardPreRate)}): cần điểm trung bình từ ${diem(r.standardMinScore)}.`
}

const HangUyTin = ({ standings = [], loungeNames = {} }) => {
  if (!standings.length) return null
  return (
    <div className="bg-card border border-line p-6 space-y-4">
      <div>
        <h2 className="font-sans font-bold text-base text-ink flex items-center gap-2">
          <Award size={16} /> Hạng uy tín
        </h2>
        <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">
          Hạng tính từ điểm đánh giá của khán giả và số buổi đã diễn. Hạng càng cao, phần tiền vé chuyển cho bạn ở đợt 1
          càng lớn; phần còn lại chuyển ở đợt 2. Đây không phải tỉ lệ hoàn tiền cho khách.
        </p>
      </div>
      {standings.map((s) => (
        <div key={s.loungeId} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
          {standings.length > 1 && <p className="text-sm font-semibold text-ink mb-1">{loungeNames[s.loungeId] ?? 'Phòng trà'}</p>}
          <p className="text-2xl text-ink">
            {TEN_HANG[s.tier] ?? s.tier}
            <span className="text-base text-ink-soft"> · nhận trước {phanTram(s.preRate)} ở đợt 1</span>
          </p>
          <p className="text-sm text-ink-soft mt-1">
            {s.ratingCount > 0
              ? `Điểm ${diem(s.score)}/5 từ ${s.ratingCount} đánh giá · ${s.completedShows} buổi đã diễn`
              : `Chưa có đánh giá nào · ${s.completedShows} buổi đã diễn`}
          </p>
          <p className="text-sm text-ink mt-1">{buocTiep(s)}</p>
        </div>
      ))}
    </div>
  )
}

export default HangUyTin
