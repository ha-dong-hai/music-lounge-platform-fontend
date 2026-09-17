// ===== CONFIGS (dùng chung toàn hệ thống complaints) =====
export const CATEGORY_CONFIG = {
  EventMisrepresentation: { label: 'Show Misrepresentation', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  RefundDispute:          { label: 'Tranh chấp hoàn tiền', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  DonationNotPaid:        { label: 'Donate Not Transfer', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  TechnicalIssue:         { label: 'Technical Issue', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  VenueConduct:           { label: 'Venue Conduct', cls: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  PenaltyAppeal:          { label: 'Penalty Appeal', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  Other:                  { label: 'Other', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
}

// Target type → tiếng Việt (dự phòng thêm các loại BE có thể trả)
export const TARGET_TYPE_LABELS = {
  venue: 'Lounge',
  show: 'Show',
  performer: 'Performer',
  user: 'Audience',
}

// ⚠️ Chỉ "Open" là chắc chắn có trong BE. Status lạ sẽ tự fallback xám + hiện nguyên text BE
export const STATUS_CONFIG = {
  Open:       { label: 'Pending', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  InProgress: { label: 'Progressing', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  Resolved:   { label: 'Resolved', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  Dismissed:  { label: 'Dismissed', cls: 'bg-gray-500/15 text-gray-500 border-gray-500/30' },
}

// ===== BADGES =====
export const CategoryBadge = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${cfg ? cfg.cls : CATEGORY_CONFIG.Other.cls}`}>
      {cfg ? cfg.label : category}
    </span>
  )
}

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${cfg ? cfg.cls : 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {cfg ? cfg.label : status}
    </span>
  )
}