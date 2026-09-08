import { Building, Radio, Cast } from 'lucide-react'

// ===== SHOW BADGES =====
export const FormatBadge = ({ format }) => {
  const styles = {
    offline: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
    livestream: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    hybrid: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
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
    published: 'bg-green-500/10 text-green-400 border-green-500/20',
    ongoing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    ended: 'bg-red-500/10 text-red-400 border-red-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const labels = { published: 'Đã đăng', ongoing: 'Đang diễn ra', draft: 'Nháp', ended: 'Đã kết thúc', cancelled: 'Đã hủy' }
  const key = status ? status.toLowerCase() : 'draft'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[key] || styles.draft}`}>
      {labels[key] || status}
    </span>
  )
}

// ===== MODERATION BADGES =====
// Vòng tròn điểm AI (0 -> 1 quy đổi ra %)
export const AIScoreCircle = ({ score }) => {
  if (score === null || score === undefined) return <div className="text-gray-600 text-sm">N/A</div>
  const numScore = Math.round(score * 100)
  const colorClass = numScore >= 70 ? 'border-green-500 text-green-400' : numScore >= 40 ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'
  return (
    <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-sm ${colorClass}`}>
      {numScore}
    </div>
  )
}

export const RiskLevelBadge = ({ level }) => {
  const styles = {
    Low: 'bg-green-500/10 text-green-400 border-green-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const labels = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao', Critical: 'Nghiêm trọng' }
  if (!level) return <span className="text-xs text-gray-500">Chưa đánh giá</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[level]}`}>
      {labels[level] || level}
    </span>
  )
}

export const AiRecommendationBadge = ({ recommendation }) => {
  const styles = {
    SuggestApprove: 'bg-green-500/10 text-green-400 border-green-500/20',
    SuggestReject: 'bg-red-500/10 text-red-400 border-red-500/20',
    SuggestManualReview: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  const labels = {
    SuggestApprove: 'Nên duyệt',
    SuggestReject: 'Nên từ chối',
    SuggestManualReview: 'Cần xem xét',
  }
  if (!recommendation) return <span className="text-xs text-gray-500">—</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[recommendation] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {labels[recommendation] || recommendation}
    </span>
  )
}