import NhanTrangThai from '../../shared/NhanTrangThai'
// 30/09/2026: nhãn vẽ bằng components/shared/NhanTrangThai (biểu tượng + chữ, 5 sắc thái) — không tự đặt màu ở đây nữa.

// ===== 6 TRẠNG THÁI PHÒNG TRÀ (nguồn sự thật duy nhất) — `label` còn được bộ lọc đọc =====
export const VENUE_STATUS_CONFIG = {
  Pending:   { label: 'Chờ duyệt',   sacThai: 'cho' },
  Approved:  { label: 'Đã duyệt',    sacThai: 'tot' },
  Warned:    { label: 'Bị cảnh báo', sacThai: 'cho' },
  Suspended: { label: 'Tạm ngưng',   sacThai: 'xau' },
  Locked:    { label: 'Bị khoá',     sacThai: 'xau' },
  Rejected:  { label: 'Bị từ chối',  sacThai: 'tat' },
}

export const VenueStatusBadge = ({ status }) => {
  const cfg = VENUE_STATUS_CONFIG[status]
  return <NhanTrangThai sacThai={cfg?.sacThai ?? 'trung'}>{cfg ? cfg.label : (status || '—')}</NhanTrangThai>
}

// Giấy phép kinh doanh
export const LicenseBadge = ({ hasLicense }) => (
  <NhanTrangThai sacThai={hasLicense ? 'tot' : 'xau'}>{hasLicense ? 'Có giấy phép' : 'Chưa có giấy phép'}</NhanTrangThai>
)
