// src/components/admin/kyc/KycBadges.jsx
// Config dùng chung — page (tabs) và DocBlock (chip) cùng đọc từ đây
import NhanTrangThai from '../../shared/NhanTrangThai'
// 30/09/2026: nhãn vẽ bằng components/shared/NhanTrangThai (biểu tượng + chữ, 5 sắc thái) — không tự đặt màu ở đây nữa.

export const KYC_TABS = [
  { key: 'Pending', label: 'Chờ duyệt' },
  { key: 'Approved', label: 'Đã duyệt' },
  { key: 'Rejected', label: 'Đã từ chối' },
]

const TRANG_THAI_KYC = { Pending: ['cho', 'Chờ duyệt'], Approved: ['tot', 'Đã duyệt'], Rejected: ['xau', 'Đã từ chối'] }

// Bản cũ in NGUYÊN mã trạng thái ("Pending", "Approved") thay vì chữ.
export const KycStatusChip = ({ status }) => {
  const [sacThai, nhan] = TRANG_THAI_KYC[status] ?? ['trung', status]
  return <NhanTrangThai sacThai={sacThai}>{nhan}</NhanTrangThai>
}
