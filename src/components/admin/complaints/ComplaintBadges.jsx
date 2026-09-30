import NhanTrangThai from '../../shared/NhanTrangThai'
// 30/09/2026: nhãn vẽ bằng components/shared/NhanTrangThai (biểu tượng + chữ, 5 sắc thái) — không tự đặt màu ở đây nữa.
// ===== CONFIGS (dùng chung toàn hệ thống complaints) =====
export const CATEGORY_CONFIG = {
  EventMisrepresentation: { label: 'Buổi diễn sai mô tả' },
  RefundDispute:          { label: 'Tranh chấp hoàn tiền' },
  DonationNotPaid:        { label: 'Ủng hộ chưa chuyển tiền' },
  TechnicalIssue:         { label: 'Sự cố kỹ thuật' },
  VenueConduct:           { label: 'Cách hành xử của phòng trà' },
  PenaltyAppeal:          { label: 'Khiếu nại án phạt' },
  ContentViolation:       { label: 'Nội dung vi phạm' },
  Other:                  { label: 'Khác' },
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
  Open:          { label: 'Chờ xử lý', sacThai: 'cho' },
  Investigating: { label: 'Đang xem xét', sacThai: 'cho' },
  Resolved:      { label: 'Đã giải quyết', sacThai: 'tot' },
  Rejected:      { label: 'Đã từ chối', sacThai: 'tat' },
}

// ===== BADGES =====
// Loại khiếu nại là PHÂN LOẠI, không phải mức độ: in bằng chữ viền mực, không tô màu nguy hiểm/cảnh báo (bản cũ tô đỏ
// "Cách hành xử của phòng trà" như thể đã có lỗi — chưa ai kết luận gì).
export const CategoryBadge = ({ category }) => (
  <span className="inline-flex items-center px-2 min-h-[26px] border border-ink/40 text-xs font-medium whitespace-nowrap">
    {CATEGORY_CONFIG[category]?.label ?? category}
  </span>
)

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status]
  return <NhanTrangThai sacThai={cfg?.sacThai ?? 'trung'}>{cfg ? cfg.label : status}</NhanTrangThai>
}
