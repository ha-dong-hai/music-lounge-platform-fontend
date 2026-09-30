import NhanTrangThai from '../../shared/NhanTrangThai'
// 30/09/2026: nhãn vẽ bằng components/shared/NhanTrangThai (biểu tượng + chữ, 5 sắc thái) — không tự đặt màu ở đây nữa.
// Vai trò in bằng tiếng Việt (bản cũ in "Admin", "Owner", "Staff", "Audience").
const VAI_TRO = { admin: 'Quản trị', owner: 'Chủ phòng trà', staff: 'Nhân viên', audience: 'Khán giả' }

export const RoleBadge = ({ role }) => (
  <NhanTrangThai sacThai="trung">{VAI_TRO[role ? role.toLowerCase() : 'audience'] ?? role}</NhanTrangThai>
)

export const StatusBadge = ({ isActive }) => (
  <NhanTrangThai sacThai={isActive ? 'tot' : 'xau'}>{isActive ? 'Đang hoạt động' : 'Bị khoá'}</NhanTrangThai>
)
