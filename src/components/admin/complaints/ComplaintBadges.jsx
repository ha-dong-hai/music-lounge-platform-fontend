// ===== CONFIGS (dùng chung toàn hệ thống complaints) =====
export const CATEGORY_CONFIG = {
  EventMisrepresentation: { label: 'Buổi diễn sai mô tả', cls: 'bg-ink/15 text-ink border-ink/30' },
  RefundDispute:          { label: 'Tranh chấp hoàn tiền', cls: 'bg-warning/15 text-warning border-warning/30' },
  DonationNotPaid:        { label: 'Ủng hộ chưa chuyển tiền', cls: 'bg-warning/15 text-warning border-warning/30' },
  TechnicalIssue:         { label: 'Sự cố kỹ thuật', cls: 'bg-ink/15 text-ink border-ink/30' },
  VenueConduct:           { label: 'Cách hành xử của phòng trà', cls: 'bg-danger/15 text-danger border-danger/30' },
  PenaltyAppeal:          { label: 'Khiếu nại án phạt', cls: 'bg-danger/15 text-danger border-danger/30' },
  ContentViolation:       { label: 'Nội dung vi phạm', cls: 'bg-danger/15 text-danger border-danger/30' },
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
  Open:          { label: 'Chờ xử lý', cls: 'bg-ink/15 text-ink border-ink/30' },
  Investigating: { label: 'Đang xem xét', cls: 'bg-warning/15 text-warning border-warning/30' },
  Resolved:      { label: 'Đã giải quyết', cls: 'bg-success/15 text-success border-success/30' },
  Rejected:      { label: 'Đã từ chối', cls: 'bg-line-strong/15 text-ink-mute border-line-strong/30' },
}

// ===== BADGES =====
export const CategoryBadge = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border whitespace-nowrap ${cfg ? cfg.cls : CATEGORY_CONFIG.Other.cls}`}>
      {cfg ? cfg.label : category}
    </span>
  )
}

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold border whitespace-nowrap ${cfg ? cfg.cls : 'bg-line-strong/15 text-ink-soft border-line-strong/30'}`}>
      {cfg ? cfg.label : status}
    </span>
  )
}