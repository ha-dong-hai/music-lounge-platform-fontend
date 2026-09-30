// src/layouts/AdminLayout.jsx
//
// KHU QUẢN TRỊ HỆ THỐNG. Khung (thanh bên, ngăn kéo cho điện thoại, đầu trang) nằm ở components/portal/PortalShell.jsx,
// dùng chung với OwnerLayout. Ở đây chỉ còn DỮ LIỆU MENU và đăng xuất.
//
// GOM NHÓM (30/09/2026): 16 mục phẳng → 4 nhóm theo loại việc: duyệt nội dung, tiền, khiếu nại, hệ thống.
import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Music, Store, Package, LogOut, Users, Receipt, MessageSquareWarning, SlidersHorizontal, ShieldAlert, Banknote, Landmark, ShieldCheck, Settings2, TrendingUp, Gavel, ExternalLink, UserCog, Building2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import PortalShell from '../components/portal/PortalShell'

const NHOM = [
  { ten: 'Tổng quan', muc: [
    { to: '/admin', end: true, nhan: 'Tổng quan', icon: LayoutDashboard },
    { to: '/admin/insights', nhan: 'Nội dung và tương tác', icon: TrendingUp },
  ] },
  { ten: 'Duyệt', muc: [
    { to: '/admin/shows', nhan: 'Buổi diễn', icon: Music },
    { to: '/admin/venues', nhan: 'Phòng trà', icon: Store },
    { to: '/admin/kyc-reviews', nhan: 'Định danh người bán', icon: ShieldCheck },
    { to: '/admin/content-reports', nhan: 'Báo cáo vi phạm', icon: ShieldAlert },
  ] },
  { ten: 'Tiền', muc: [
    { to: '/admin/refunds', nhan: 'Hoàn tiền', icon: Banknote },
    { to: '/admin/settlements', nhan: 'Quyết toán', icon: Landmark },
    { to: '/admin/ledger', nhan: 'Sổ cái', icon: Receipt },
    { to: '/admin/bank-accounts', nhan: 'Tài khoản nhận tiền', icon: Building2 },
    { to: '/admin/packages', nhan: 'Gói dịch vụ', icon: Package },
  ] },
  { ten: 'Khiếu nại', muc: [
    { to: '/admin/complaint', nhan: 'Xử lý khiếu nại', icon: MessageSquareWarning },
    { to: '/admin/penalty-appeals', nhan: 'Khiếu nại án phạt', icon: Gavel },
  ] },
  { ten: 'Hệ thống', muc: [
    { to: '/admin/accounts', nhan: 'Tài khoản người dùng', icon: Users },
    { to: '/admin/filter-options', nhan: 'Danh mục phân loại', icon: SlidersHorizontal },
    { to: '/admin/system-config', nhan: 'Cấu hình hệ thống', icon: Settings2 },
  ] },
]

// LỐI RA — Admin cần xem sản phẩm như khách thấy (kiểm một buổi diễn vừa duyệt chẳng hạn).
const LOI_RA = [
  { to: '/account', nhan: 'Tài khoản của tôi', icon: UserCog },
  { to: '/', nhan: 'Về trang công khai', icon: ExternalLink },
]

const AdminLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const ten = useAuthStore((s) => s.user?.name || s.user?.fullName || s.user?.email || '')

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
    <PortalShell portalName="Quản trị hệ thống" nhom={NHOM} loiRa={LOI_RA} footer={footer}
      headerRight={ten ? <span className="text-sm text-ink-soft">Đăng nhập: <span className="font-semibold text-ink">{ten}</span></span> : null}>
      <Outlet />
    </PortalShell>
  )
}

export default AdminLayout
