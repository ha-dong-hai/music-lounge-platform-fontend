// ===== CONFIGS (dùng chung toàn hệ thống complaints) =====
export const CATEGORY_CONFIG = {
  EventMisrepresentation: { label: 'Buổi diễn sai mô tả', cls: 'bg-blue-500/15 text-sky-700 border-blue-500/30' },
  RefundDispute:          { label: 'Tranh chấp hoàn tiền', cls: 'bg-orange-500/15 text-orange-700 border-orange-500/30' },
  DonationNotPaid:        { label: 'Ủng hộ chưa chuyển tiền', cls: 'bg-yellow-500/15 text-warning border-yellow-500/30' },
  TechnicalIssue:         { label: 'Sự cố kỹ thuật', cls: 'bg-purple-500/15 text-purple-700 border-purple-500/30' },
  VenueConduct:           { label: 'Cách hành xử của phòng trà', cls: 'bg-pink-500/15 text-pink-700 border-pink-500/30' },
  PenaltyAppeal:          { label: 'Khiếu nại án phạt', cls: 'bg-red-500/15 text-danger border-red-500/30' },
  ContentViolation:       { label: 'Nội dung vi phạm', cls: 'bg-rose-500/15 text-danger border-rose-500/30' },
  Other:                  { label: 'Khác', cls: 'bg-line-strong/15 text-ink-soft border-line-strong/30' },
}

// Đúng 6 giá trị ComplaintDto.targetType của backend (origin/master), chữ thường.
// Lưu ý: 'show' trỏ LoungeShow.Id còn 'livestream' trỏ Livestream.Id — hai mã khác nhau.
export const TARGET_TYPE_LABELS = {
  show: 'Buổi diễn',
  venue: 'Phòng trà',
  donation: 'Ủng hộ nghệ sĩ',
  ticket: 'Vé',
  penalty: 'Án phạt',
  livestream: 'Livestream',
}

// Đúng 4 giá trị Complaint.Status của backend. Status lạ vẫn fallback xám + hiện nguyên text BE.
// GET /complaints/pending chỉ trả Open + Investigating; Resolved/Rejected chỉ xuất hiện khi
// nào backend có endpoint xem khiếu nại đã xử lý.
export const STATUS_CONFIG = {
  Open:          { label: 'Chờ xử lý', cls: 'bg-blue-500/15 text-sky-700 border-blue-500/30' },
  Investigating: { label: 'Đang xem xét', cls: 'bg-yellow-500/15 text-warning border-yellow-500/30' },
  Resolved:      { label: 'Đã giải quyết', cls: 'bg-green-500/15 text-success border-green-500/30' },
  Rejected:      { label: 'Đã từ chối', cls: 'bg-line-strong/15 text-ink-mute border-line-strong/30' },
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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${cfg ? cfg.cls : 'bg-line-strong/15 text-ink-soft border-line-strong/30'}`}>
      {cfg ? cfg.label : status}
    </span>
  )
}