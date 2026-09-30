// src/layouts/OwnerLayout.jsx
//
// KHU LÀM VIỆC CỦA CHỦ PHÒNG TRÀ VÀ NHÂN VIÊN. Khung (thanh bên, ngăn kéo cho điện thoại, đầu trang) nằm ở
// components/portal/PortalShell.jsx, dùng chung với AdminLayout. Ở đây chỉ còn DỮ LIỆU MENU và đăng xuất.
//
// GOM NHÓM (30/09/2026): 15 mục phẳng → 4 nhóm theo việc người vận hành đang làm: dựng phòng trà, chạy đêm diễn,
// tiền, tuân thủ. Thứ tự trong nhóm giữ như cũ.
//
// Nhân viên (Staff) chỉ thấy các mục RequireVenueOperator (vận hành đêm diễn, đơn gọi món, livestream). Mục nào gọi
// endpoint RequireOwner thì ẩn với Staff — phải khớp guard từng route trong AppRouter.jsx.
// Chỉ thêm mục khi trang đã thật sự tồn tại, tránh link chết.
import { Outlet, useNavigate } from 'react-router-dom'
import { Radio, LogOut, Package, BarChart3, CalendarDays, Store, Landmark, ScanLine, UtensilsCrossed, BookOpen, Mic2, Users, HeartHandshake, ShieldAlert, LayoutGrid, Box, Wallet, ShieldCheck, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import PortalShell from '../components/portal/PortalShell'

const OwnerLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const isOwner = useAuthStore((s) => s.user?.role) === 'Owner'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const chiChu = (muc) => (isOwner ? muc : [])
  const nhom = [
    { ten: 'Phòng trà', muc: chiChu([
      { to: '/owner/lounge', nhan: 'Hồ sơ phòng trà', icon: Store },
      { to: '/owner/zones', nhan: 'Khu vực chỗ ngồi', icon: LayoutGrid },
      { to: '/owner/tour', nhan: 'Tham quan 360°', icon: Box },
      { to: '/owner/performers', nhan: 'Nghệ sĩ', icon: Mic2 },
      { to: '/owner/staff', nhan: 'Nhân viên', icon: Users },
      { to: '/owner/fnb-menus', nhan: 'Thực đơn', icon: BookOpen },
    ]) },
    { ten: 'Đêm diễn', muc: [
      ...chiChu([{ to: '/owner/shows', nhan: 'Buổi diễn', icon: CalendarDays }]),
      // Nhân viên dùng được: soát vé, bán vé quầy, bắt đầu/kết thúc đều là RequireVenueOperator
      { to: '/owner/operate', nhan: 'Vận hành đêm diễn', icon: ScanLine },
      { to: '/owner/fnb-orders', nhan: 'Đơn gọi món', icon: UtensilsCrossed },
      { to: '/owner/livestreams', nhan: 'Phát trực tuyến', icon: Radio },
    ] },
    { ten: 'Tiền', muc: chiChu([
      { to: '/owner/finance', nhan: 'Tiền và quyết toán', icon: Wallet },
      { to: '/owner/analytics', nhan: 'Báo cáo doanh thu', icon: BarChart3 },
      { to: '/owner/donations', nhan: 'Tiền ủng hộ nghệ sĩ', icon: HeartHandshake },
      { to: '/owner/bank-accounts', nhan: 'Tài khoản nhận tiền', icon: Landmark },
      { to: '/owner/subscription', nhan: 'Gói dịch vụ', icon: Package },
    ]) },
    { ten: 'Tuân thủ', muc: chiChu([{ to: '/owner/penalties', nhan: 'Án phạt', icon: ShieldAlert }]) },
  ].filter((n) => n.muc.length > 0)

  // HAI LỐI RA, cho cả nhân viên:
  // - Định danh: với chủ phòng trà, XÁC MINH DANH TÍNH là cửa bắt buộc để bán vé (MLACP-397) mà lại nằm ở trang tài
  //   khoản chung — không có lối này thì bị chặn lúc bán vé mà không biết đi đâu mở khoá.
  // - Trang công khai: để chủ phòng trà xem trang của mình hiện ra sao với khách.
  const loiRa = [
    { to: '/account?tab=identity', nhan: 'Định danh và tài khoản', icon: ShieldCheck },
    { to: '/', nhan: 'Về trang công khai', icon: ExternalLink },
  ]

  const footer = (
    <button type="button" onClick={handleLogout}
      className="flex items-center gap-3 px-3 min-h-[44px] w-full text-sm font-medium text-lamp-mute hover:text-lamp hover:bg-board-soft transition-colors">
      <LogOut size={18} aria-hidden="true" /> Đăng xuất
    </button>
  )

  return (
    <PortalShell portalName={isOwner ? 'Phòng trà của tôi' : 'Nhân viên phòng trà'} nhom={nhom} loiRa={loiRa} footer={footer}>
      <Outlet />
    </PortalShell>
  )
}

export default OwnerLayout
