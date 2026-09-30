// src/components/admin/penalty-appeals/PenaltyBadges.jsx
// ⚠ Giữ trùng với OwnerPenaltiesPage: hai bên phải gọi cùng một mức phạt bằng cùng một chữ.
// Khi làm trang Owner penalties, import TYPE_VIEW/STATUS_VIEW từ đây — không copy sang file khác.
import { AlertTriangle, ShieldAlert, Ban } from 'lucide-react'
import NhanTrangThai from '../../shared/NhanTrangThai'
// 30/09/2026: nhãn vẽ bằng components/shared/NhanTrangThai (biểu tượng + chữ, 5 sắc thái) — không tự đặt màu ở đây nữa.

export const PENALTY_TYPE_VIEW = {
  Warning: { label: 'Cảnh cáo', sacThai: 'cho', cls: 'text-warning', icon: AlertTriangle },
  Suspension: { label: 'Tạm đình chỉ', sacThai: 'xau', cls: 'text-danger', icon: ShieldAlert },
  Ban: { label: 'Cấm hoạt động', sacThai: 'xau', cls: 'text-danger', icon: Ban },
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
  const loai = PENALTY_TYPE_VIEW[type] ?? { label: type, sacThai: 'trung', icon: ShieldAlert }
  return <NhanTrangThai sacThai={loai.sacThai} icon={loai.icon}>{loai.label}</NhanTrangThai>
}

export const penaltyStatusLabel = (status) =>
  PENALTY_STATUS_VIEW[status]?.label ?? status

export const penaltyStatusCls = (status) =>
  PENALTY_STATUS_VIEW[status]?.cls ?? 'text-ink-soft'