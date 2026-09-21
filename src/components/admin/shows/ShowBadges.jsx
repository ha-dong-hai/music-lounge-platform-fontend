import { Building, Radio, Cast } from 'lucide-react'

// ===== SHOW BADGES =====
export const FormatBadge = ({ format }) => {
  const styles = {
    offline: 'bg-line-strong/10 text-ink-soft border-line-strong/20',
    livestream: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    hybrid: 'bg-blue-500/10 text-sky-700 border-blue-500/20',
  }
  const icons = { offline: <Building size={12} />, livestream: <Radio size={12} />, hybrid: <Cast size={12} /> }
  const labels = { offline: 'Offline', livestream: 'Livestream', hybrid: 'Hybrid' }
  const key = format ? format.toLowerCase() : 'offline'
  if (!labels[key]) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${styles[key]}`}>
      {icons[key]}{labels[key]}
    </span>
  )
}

export const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-green-500/10 text-success border-green-500/20',
    ongoing: 'bg-blue-500/10 text-sky-700 border-blue-500/20',
    draft: 'bg-line-strong/10 text-ink-soft border-line-strong/20',
    ended: 'bg-red-500/10 text-danger border-red-500/20',
    cancelled: 'bg-red-500/10 text-danger border-red-500/20',
  }
  const labels = { published: 'Published', ongoing: 'Ongoing', draft: 'Draft', ended: 'Ended', cancelled: 'Cancelled' }
  const key = status ? status.toLowerCase() : 'draft'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[key] || styles.draft}`}>
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
  const colorClass = numScore >= 70 ? 'border-green-500 text-success' : numScore >= 40 ? 'border-yellow-500 text-warning' : 'border-red-500 text-danger'
  return (
    <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-sm ${colorClass}`}>
      {numScore}
    </div>
  )
}

export const RiskLevelBadge = ({ level }) => {
  const styles = {
    Low: 'bg-green-500/10 text-success border-green-500/20',
    Medium: 'bg-yellow-500/10 text-warning border-yellow-500/20',
    High: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    Critical: 'bg-red-500/10 text-danger border-red-500/20',
  }
  const labels = { Low: 'Low', Medium: 'Medium', High: 'High', Critical: 'Critical' }
  if (!level) return <span className="text-xs text-ink-mute">Not rated</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[level]}`}>
      {labels[level] || level}
    </span>
  )
}

export const AiRecommendationBadge = ({ recommendation }) => {
  const styles = {
    SuggestApprove: 'bg-green-500/10 text-success border-green-500/20',
    SuggestReject: 'bg-red-500/10 text-danger border-red-500/20',
    SuggestManualReview: 'bg-yellow-500/10 text-warning border-yellow-500/20',
  }
  const labels = {
    SuggestApprove: 'Nên duyệt',
    SuggestReject: 'Nên từ chối',
    SuggestManualReview: 'Cần xem xét',
  }
  if (!recommendation) return <span className="text-xs text-ink-mute">—</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[recommendation] || 'bg-line-strong/10 text-ink-soft border-line-strong/20'}`}>
      {labels[recommendation] || recommendation}
    </span>
  )
}