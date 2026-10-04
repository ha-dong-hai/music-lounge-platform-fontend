// src/layouts/AdminLayout.jsx
//
// KHU QUẢN TRỊ HỆ THỐNG. Từ 05/10/2026 khung trang (thanh bên thu gọn được, ngăn kéo cho điện thoại, đầu trang) là bản
// chuyển từ mẫu shadcn-admin: components/ui/admin/khung-quan-tri.jsx — chủ dự án yêu cầu bố cục lấy từ repo template đã
// thiết kế sẵn, không tự dựng. (Khu chủ phòng trà vẫn dùng components/portal/PortalShell cho tới khi mẫu này được duyệt.)
// Dữ liệu menu ở layouts/menuQuanTri.js. Ở đây: gắn số việc chờ vào từng mục (MLACP-618), chuông thông báo và đăng xuất.
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import KhungQuanTri from '../components/ui/admin/khung-quan-tri'
import { NHOM, LOI_RA } from './menuQuanTri'
import NotificationBell from '../components/notifications/NotificationBell'
import { useHangDoiViec } from '../hooks/useHangDoiViec'
import { duongDanCua } from '../utils/viecCho'

const AdminLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const ten = user?.name || user?.fullName || user?.email || 'Quản trị viên'

  // MLACP-618: số việc chờ trên từng mục. Mã hàng đợi của backend chính là đoạn đường dẫn sau /admin/.
  const { data: hangDoi = [] } = useHangDoiViec()
  const demTheoDuong = Object.fromEntries(hangDoi.map((v) => [duongDanCua(v.key), v]))
  const nhom = NHOM.map((n) => ({ ...n, muc: n.muc.map((m) => ({ ...m, dem: demTheoDuong[m.to] })) }))

  const handleLogout = () => {
    // Trước đây xoá key 'token'/'user' không khớp key thật ('musiclounge-auth') mà useAuthStore
    // dùng — bấm Đăng xuất không thực sự xoá session, token cũ vẫn được axios gắn vào request sau đó.
    logout()
    navigate('/login')
  }

  return (
    // MLACP-618: chuông thông báo — các job cảnh báo quá hạn (hoàn tiền, khiếu nại, báo cáo vi phạm, duyệt nội dung) đã
    // gửi thông báo cho Admin từ lâu, nhưng khu Admin không có chuông nên không ai đọc được chúng.
    <KhungQuanTri tenKhu="Quản trị hệ thống" nhom={nhom} loiRa={LOI_RA} onDangXuat={handleLogout}
      nguoiDung={{ ten, email: user?.email && user.email !== ten ? user.email : null, anh: user?.avatarUrl ?? null }}
      phaiDauTrang={<NotificationBell />} />
  )
}

export default AdminLayout
