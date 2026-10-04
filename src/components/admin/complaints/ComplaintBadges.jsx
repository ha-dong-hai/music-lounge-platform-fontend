import { FileWarning, ReceiptText, HandCoins, Wrench, Handshake, Gavel, Flag, CircleEllipsis } from 'lucide-react'
import NhanTrangThai from '../../shared/NhanTrangThai'
import NhanPhanLoai from '../../shared/NhanPhanLoai'
// 30/09/2026: nhãn vẽ bằng components/shared/NhanTrangThai (biểu tượng + chữ, 5 sắc thái) — không tự đặt màu ở đây nữa.
// ===== CONFIGS (dùng chung toàn hệ thống complaints) =====
export const CATEGORY_CONFIG = {
  // MLACP-623: 8 loại > 4 kiểu của NhanPhanLoai, nên xếp thành 4 NHÓM theo "khiếu nại về cái gì", mỗi nhóm 2 loại:
  // tiền (đặc) · phòng trà (vừa) · nội dung buổi diễn (viền) · hệ thống và khác (nhạt). Trong một nhóm, biểu tượng phân
  // biệt từng loại. Nhóm KHÔNG phải mức ưu tiên — hạn xử lý mới là thứ xếp việc trước sau.
  EventMisrepresentation: { label: 'Buổi diễn sai mô tả', kieu: 'vien', icon: FileWarning },
  RefundDispute:          { label: 'Tranh chấp hoàn tiền', kieu: 'dac', icon: ReceiptText },
  DonationNotPaid:        { label: 'Ủng hộ chưa chuyển tiền', kieu: 'dac', icon: HandCoins },
  TechnicalIssue:         { label: 'Sự cố kỹ thuật', kieu: 'nhat', icon: Wrench },
  VenueConduct:           { label: 'Cách hành xử của phòng trà', kieu: 'vua', icon: Handshake },
  PenaltyAppeal:          { label: 'Khiếu nại án phạt', kieu: 'vua', icon: Gavel },
  ContentViolation:       { label: 'Nội dung vi phạm', kieu: 'vien', icon: Flag },
  Other:                  { label: 'Khác', kieu: 'nhat', icon: CircleEllipsis },
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
// Loại khiếu nại là PHÂN LOẠI, không phải mức độ: không tô màu nguy hiểm/cảnh báo (bản cũ tô đỏ "Cách hành xử của phòng
// trà" như thể đã có lỗi — chưa ai kết luận gì). Phân biệt bằng biểu tượng + độ đậm của mực (NhanPhanLoai).
export const CategoryBadge = ({ category }) => {
  const c = CATEGORY_CONFIG[category]
  return <NhanPhanLoai kieu={c?.kieu ?? 'vien'} icon={c?.icon ?? CircleEllipsis}>{c?.label ?? category}</NhanPhanLoai>
}

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status]
  return <NhanTrangThai sacThai={cfg?.sacThai ?? 'trung'}>{cfg ? cfg.label : status}</NhanTrangThai>
}
