// src/layouts/AdminLayout.jsx
//
// KHU QUẢN TRỊ HỆ THỐNG. Khung (thanh bên, ngăn kéo cho điện thoại, đầu trang) nằm ở components/portal/PortalShell.jsx,
// dùng chung với OwnerLayout. Dữ liệu menu ở layouts/menuQuanTri.js. Ở đây: gắn số việc chờ vào từng mục (MLACP-618),
// chuông thông báo và đăng xuất.
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { LogOut } from 'lucide-react'
import PortalShell from '../components/portal/PortalShell'
import { NHOM, LOI_RA } from './menuQuanTri'
import NotificationBell from '../components/notifications/NotificationBell'
import { useHangDoiViec } from '../hooks/useHangDoiViec'
import { duongDanCua } from '../utils/viecCho'

const AdminLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const ten = useAuthStore((s) => s.user?.name || s.user?.fullName || s.user?.email || '')

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

  const footer = (
    <button type="button" onClick={handleLogout}
      className="flex items-center gap-3 px-3 min-h-[44px] w-full text-sm font-medium text-lamp-mute hover:text-lamp hover:bg-board-soft transition-colors">
      <LogOut size={18} aria-hidden="true" /> Đăng xuất
    </button>
  )

  return (
    // MLACP-618: chuông thông báo — các job cảnh báo quá hạn (hoàn tiền, khiếu nại, báo cáo vi phạm, duyệt nội dung) đã
    // gửi thông báo cho Admin từ lâu, nhưng khu Admin không có chuông nên không ai đọc được chúng.
    <PortalShell portalName="Quản trị hệ thống" nhom={nhom} loiRa={LOI_RA} footer={footer}
      headerRight={
        <div className="flex items-center gap-3">
          {ten && <span className="hidden sm:inline text-sm text-ink-soft">Đăng nhập: <span className="font-semibold text-ink">{ten}</span></span>}
          <NotificationBell />
        </div>
      }>
      <Outlet />
    </PortalShell>
  )
}

export default AdminLayout
