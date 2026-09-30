import { Building, Radio, Cast } from 'lucide-react'

// ===== SHOW BADGES =====
export const FormatBadge = ({ format }) => {
  const styles = {
    offline: 'bg-line-strong/10 text-ink-soft border-line-strong/20',
    livestream: 'bg-ink/10 text-ink border-ink/20',
    hybrid: 'bg-ink/10 text-ink border-ink/20',
  }
  const icons = { offline: <Building size={12} />, livestream: <Radio size={12} />, hybrid: <Cast size={12} /> }
  const labels = { offline: 'Tại chỗ', livestream: 'Livestream', hybrid: 'Kết hợp' }
  const key = format ? format.toLowerCase() : 'offline'
  if (!labels[key]) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border ${styles[key]}`}>
      {icons[key]}{labels[key]}
    </span>
  )
}

export const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-success/10 text-success border-success/20',
    ongoing: 'bg-ink/10 text-ink border-ink/20',
    draft: 'bg-line-strong/10 text-ink-soft border-line-strong/20',
    pending: 'bg-warning/10 text-warning border-warning/30',
    ended: 'bg-danger/10 text-danger border-danger/20',
    cancelled: 'bg-danger/10 text-danger border-danger/20',
  }
  // Đủ 6 giá trị LoungeShowStatus của backend (Draft, Pending, Published, Ongoing, Ended, Cancelled).
  // Badge DÙNG CHUNG cho mọi màn hiện trạng thái buổi diễn — đừng viết lại một bảng nhãn khác
  // (AllShowsTab từng có bản sao riêng in nhãn tiếng Anh).
  const labels = { published: 'Đã xuất bản', ongoing: 'Đang diễn ra', draft: 'Bản nháp', pending: 'Chờ duyệt', ended: 'Đã kết thúc', cancelled: 'Đã huỷ' }
  const key = status ? status.toLowerCase() : 'draft'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${styles[key] || styles.draft}`}>
      {labels[key] || status}
    </span>
  )
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
        <p className="text-[10px] text-ink-mute mt-0.5 leading-tight">vẫn trong hạn duyệt tay</p>
      </div>
    )
  }
  const numScore = Math.round(score * 100)
  const colorClass = numScore >= 70 ? 'border-success text-success' : numScore >= 40 ? 'border-warning text-warning' : 'border-danger text-danger'
  return (
    <div className={`w-10 h-10 flex items-center justify-center border-2 font-bold text-sm ${colorClass}`}>
      {numScore}
    </div>
  )
}

export const RiskLevelBadge = ({ level }) => {
  const styles = {
    Low: 'bg-success/10 text-success border-success/20',
    Medium: 'bg-warning/10 text-warning border-warning/20',
    High: 'bg-warning/10 text-warning border-warning/20',
    Critical: 'bg-danger/10 text-danger border-danger/20',
  }
  const labels = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao', Critical: 'Nghiêm trọng' }
  if (!level) return <span className="text-xs text-ink-mute">Chưa chấm</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${styles[level]}`}>
      {labels[level] || level}
    </span>
  )
}

export const AiRecommendationBadge = ({ recommendation }) => {
  const styles = {
    SuggestApprove: 'bg-success/10 text-success border-success/20',
    SuggestReject: 'bg-danger/10 text-danger border-danger/20',
    SuggestManualReview: 'bg-warning/10 text-warning border-warning/20',
  }
  const labels = {
    SuggestApprove: 'Nên duyệt',
    SuggestReject: 'Nên từ chối',
    SuggestManualReview: 'Cần xem xét',
  }
  if (!recommendation) return <span className="text-xs text-ink-mute">—</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${styles[recommendation] || 'bg-line-strong/10 text-ink-soft border-line-strong/20'}`}>
      {labels[recommendation] || recommendation}
    </span>
  )
}