import { ShieldCheck, Store, IdCard, User } from 'lucide-react'
import NhanTrangThai from '../../shared/NhanTrangThai'
import NhanPhanLoai from '../../shared/NhanPhanLoai'
// 30/09/2026: nhãn vẽ bằng components/shared/NhanTrangThai (biểu tượng + chữ, 5 sắc thái) — không tự đặt màu ở đây nữa.
// Vai trò in bằng tiếng Việt (bản cũ in "Admin", "Owner", "Staff", "Audience").
const VAI_TRO = { admin: 'Quản trị', owner: 'Chủ phòng trà', staff: 'Nhân viên', audience: 'Khán giả' }
// MLACP-623: vai trò là PHÂN LOẠI, không phải trạng thái — mỗi vai một biểu tượng, độ đậm theo mức quyền (quyền càng
// rộng càng đậm) để lướt cột là thấy tài khoản quản trị và chủ phòng trà giữa hàng trăm khán giả.
const KIEU_VAI_TRO = {
  admin: { kieu: 'dac', icon: ShieldCheck },
  owner: { kieu: 'vua', icon: Store },
  staff: { kieu: 'vien', icon: IdCard },
  audience: { kieu: 'nhat', icon: User },
}

export const RoleBadge = ({ role }) => {
  const khoa = role ? role.toLowerCase() : 'audience'
  const k = KIEU_VAI_TRO[khoa] ?? { kieu: 'vien', icon: User }
  return <NhanPhanLoai kieu={k.kieu} icon={k.icon}>{VAI_TRO[khoa] ?? role}</NhanPhanLoai>
}

export const StatusBadge = ({ isActive }) => (
  <NhanTrangThai sacThai={isActive ? 'tot' : 'xau'}>{isActive ? 'Đang hoạt động' : 'Bị khoá'}</NhanTrangThai>
)
