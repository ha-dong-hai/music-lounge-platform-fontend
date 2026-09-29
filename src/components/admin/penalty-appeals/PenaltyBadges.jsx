// src/components/admin/penalty-appeals/PenaltyBadges.jsx
// ⚠ Giữ trùng với OwnerPenaltiesPage: hai bên phải gọi cùng một mức phạt bằng cùng một chữ.
// Khi làm trang Owner penalties, import TYPE_VIEW/STATUS_VIEW từ đây — không copy sang file khác.
import { AlertTriangle, ShieldAlert, Ban } from 'lucide-react'

export const PENALTY_TYPE_VIEW = {
  Warning: { label: 'Cảnh cáo', cls: 'bg-yellow-500/10 text-warning border-yellow-500/30', icon: AlertTriangle },
  Suspension: { label: 'Tạm đình chỉ', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: ShieldAlert },
  Ban: { label: 'Cấm hoạt động', cls: 'bg-red-500/10 text-danger border-red-500/30', icon: Ban },
}

// MÁY TRẠNG THÁI THẬT: Active → (chủ khiếu nại) → Appealed → (Admin quyết) → Overturned | Upheld
export const PENALTY_STATUS_VIEW = {
  Active: { label: 'Đang hiệu lực', cls: 'text-danger' },
  Appealed: { label: 'Đã khiếu nại, chờ xử lý', cls: 'text-warning' },
  Overturned: { label: 'Đã huỷ sau khiếu nại', cls: 'text-success' },
  Upheld: { label: 'Giữ nguyên án phạt', cls: 'text-ink-soft' },
  Expired: { label: 'Đã hết hiệu lực', cls: 'text-ink-mute' },
}

export const PenaltyTypeBadge = ({ type }) => {
  const loai = PENALTY_TYPE_VIEW[type] ?? { label: type, cls: 'bg-line-strong/10 text-ink-soft border-line-strong/30', icon: ShieldAlert }
  const Icon = loai.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${loai.cls}`}>
      <Icon size={12} /> {loai.label}
    </span>
  )
}

export const penaltyStatusLabel = (status) =>
  PENALTY_STATUS_VIEW[status]?.label ?? status

export const penaltyStatusCls = (status) =>
  PENALTY_STATUS_VIEW[status]?.cls ?? 'text-ink-soft'