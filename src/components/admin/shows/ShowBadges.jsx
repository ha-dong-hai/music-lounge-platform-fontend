import { Building, Radio, Cast } from 'lucide-react'
import NhanTrangThai from '../../shared/NhanTrangThai'
import NhanPhanLoai from '../../shared/NhanPhanLoai'

// 30/09/2026: nhãn vẽ bằng components/shared/NhanTrangThai (biểu tượng + chữ, 5 sắc thái) — không tự đặt màu ở đây nữa.
// ===== SHOW BADGES =====
const HINH_THUC = {
  // MLACP-623: hình thức là phân loại — ba hình thức ba độ đậm (xem NhanPhanLoai), không còn ba ô viền giống nhau.
  offline: { nhan: 'Tại chỗ', icon: Building, kieu: 'vien' },
  online: { nhan: 'Trực tuyến', icon: Radio, kieu: 'vua' },
  livestream: { nhan: 'Trực tuyến', icon: Radio, kieu: 'vua' },
  hybrid: { nhan: 'Tại chỗ và trực tuyến', icon: Cast, kieu: 'dac' },
}
export const FormatBadge = ({ format }) => {
  const h = HINH_THUC[format ? format.toLowerCase() : 'offline']
  if (!h) return null
  return <NhanPhanLoai kieu={h.kieu} icon={h.icon}>{h.nhan}</NhanPhanLoai>
}

// Đủ 6 giá trị LoungeShowStatus của backend (Draft, Pending, Published, Ongoing, Ended, Cancelled).
// Badge DÙNG CHUNG cho mọi màn hiện trạng thái buổi diễn — đừng viết lại một bảng nhãn khác
// (AllShowsTab từng có bản sao riêng in nhãn tiếng Anh).
const TRANG_THAI_BUOI = {
  published: ['tot', 'Đã xuất bản'], ongoing: ['dien', 'Đang diễn'], draft: ['tat', 'Bản nháp'],
  pending: ['cho', 'Chờ duyệt'], ended: ['tat', 'Đã kết thúc'], cancelled: ['xau', 'Đã huỷ'],
}
export const StatusBadge = ({ status }) => {
  const [sacThai, nhan] = TRANG_THAI_BUOI[status ? status.toLowerCase() : 'draft'] ?? ['trung', status]
  return <NhanTrangThai sacThai={sacThai}>{nhan}</NhanTrangThai>
}

// ===== MODERATION BADGES =====
// Vòng tròn điểm AI (0 -> 1 quy đổi ra %)
// `score` NULL nghĩa là CHƯA ĐƯỢC CHẤM, không phải "chấm ra 0".
// Khi hệ thống chưa cấu hình khoá AI thì dịch vụ chấm điểm trả null và tác vụ nền KHÔNG ghi gì vào
// bản ghi — nên trường này giữ nguyên null (đã đối chiếu mã nguồn backend, không đoán).
// Hiện "N/A" trơn là để người duyệt tự hiểu, mà hai cách hiểu sai đều có hại: tưởng hệ thống hỏng,
// hoặc tưởng bản ghi này lọt lưới. Thực tế nó vẫn nằm trong hạn duyệt tay (SlaDeadline) — hàng rào
// thật là thời hạn cho NGƯỜI, không phải điểm AI. Nên nói đúng câu đó ra.
export const AIScoreCircle = ({ score }) => {
  if (score === null || score === undefined) {
    return (
      <div className="text-center">
        <p className="text-ink-mute text-sm font-medium">Chưa chấm</p>
        <p className="text-xs text-ink-mute mt-0.5 leading-tight">vẫn trong hạn duyệt tay</p>
      </div>
    )
  }
  const numScore = Math.round(score * 100)
  const colorClass = numScore >= 70 ? 'border-success text-success' : numScore >= 40 ? 'border-warning text-warning' : 'border-danger text-danger'
  return (
    <div className={`w-10 h-10 flex items-center justify-center border-2 font-bold text-sm ${colorClass}`}>
      <span aria-label={`Điểm AI ${numScore} trên 100`}>{numScore}</span>
    </div>
  )
}

const MUC_RUI_RO = { Low: ['tot', 'Rủi ro thấp'], Medium: ['cho', 'Rủi ro trung bình'], High: ['xau', 'Rủi ro cao'], Critical: ['xau', 'Rủi ro nghiêm trọng'] }
export const RiskLevelBadge = ({ level }) => {
  if (!level) return <span className="text-xs text-ink-mute">Chưa chấm</span>
  const [sacThai, nhan] = MUC_RUI_RO[level] ?? ['trung', level]
  return <NhanTrangThai sacThai={sacThai}>{nhan}</NhanTrangThai>
}

// Khoá = enum AiModerationRecommendation của backend: SuggestApprove | NeedsReview | SuggestReject. Sửa 01/10/2026: bản cũ
// dùng 'SuggestManualReview' (không tồn tại) nên gợi ý "cần xem kỹ" rơi xuống nhánh dự phòng và in thô "NeedsReview".
// Kiểm bằng scratchpad/doi_chieu_enum.mjs.
const GOI_Y_AI = { SuggestApprove: ['tot', 'AI gợi ý duyệt'], SuggestReject: ['xau', 'AI gợi ý từ chối'], NeedsReview: ['cho', 'AI gợi ý xem kỹ'] }
export const AiRecommendationBadge = ({ recommendation }) => {
  if (!recommendation) return <span className="text-xs text-ink-mute">—</span>
  const [sacThai, nhan] = GOI_Y_AI[recommendation] ?? ['trung', recommendation]
  return <NhanTrangThai sacThai={sacThai}>{nhan}</NhanTrangThai>
}
