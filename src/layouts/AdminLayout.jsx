// src/layouts/AdminLayout.jsx
//
// GHI CHÚ CHO ĐỘI FE: khung (thanh bên + thanh tiêu đề + vùng nội dung) nay nằm ở components/portal/PortalShell.jsx,
// dùng chung với OwnerLayout — xem ghi chú trong tệp đó để biết vì sao phải làm ngăn kéo cho màn hẹp.
// Ở đây chỉ còn DANH SÁCH MỤC và hành động đăng xuất. Mọi mục nav giữ nguyên như trước, chỉ Việt hoá nhãn.
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Music, Store, Package, LogOut, Users, Receipt, MessageSquareWarning, SlidersHorizontal, ShieldAlert, Banknote, Landmark, ShieldCheck, Settings2, TrendingUp, Gavel, ExternalLink, UserCog } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import PortalShell from '../components/portal/PortalShell'

// min-h-[44px] thay cho py-3: vùng chạm đủ lớn cho ngón tay khi mở bằng ngăn kéo trên điện thoại.
const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-4 min-h-[44px] text-sm font-medium transition-colors ${isActive
    ? 'bg-sunken text-ink'
    : 'text-ink-soft hover:text-ink hover:bg-sunken/50'
  }`

const AdminLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    // Trước đây xoá key 'token'/'user' không khớp key thật ('musiclounge-auth') mà useAuthStore
    // dùng — bấm Đăng xuất không thực sự xoá session, token cũ vẫn được axios gắn vào request sau đó.
    logout()
    navigate('/login')
  }

  const nav = (
    <>
      <NavLink to="/admin" end className={linkClasses}>
        <LayoutDashboard size={18} /> Tổng quan
      </NavLink>
      <NavLink to="/admin/shows" className={linkClasses}>
        <Music size={18} /> Buổi diễn
      </NavLink>
      <NavLink to="/admin/venues" className={linkClasses}>
        <Store size={18} /> Phòng trà
      </NavLink>
      <NavLink to="/admin/filter-options" className={linkClasses}>
        <SlidersHorizontal size={18} />
        <span>Bộ lọc &amp; phân loại</span>
      </NavLink>
      <NavLink to="/admin/kyc-reviews" className={linkClasses}>
        <ShieldCheck size={18} /> Duyệt định danh
      </NavLink>
      <NavLink to="/admin/insights" className={linkClasses}>
        <TrendingUp size={18} /> Nội dung &amp; tương tác
      </NavLink>
      <NavLink to="/admin/system-config" className={linkClasses}>
        <Settings2 size={18} /> Cấu hình hệ thống
      </NavLink>
      <NavLink to="/admin/accounts" className={linkClasses}>
        <Users size={18} /> Quản lý tài khoản
      </NavLink>
      <NavLink to="/admin/packages" className={linkClasses}>
        <Package size={18} /> Gói dịch vụ
      </NavLink>
      <NavLink to="/admin/refunds" className={linkClasses}>
        <Banknote size={18} /> Hoàn tiền
      </NavLink>
      <NavLink to="/admin/settlements" className={linkClasses}>
        <Landmark size={18} /> Quyết toán
      </NavLink>
      <NavLink to="/admin/ledger" className={linkClasses}>
        <Receipt size={18} /> Sổ cái
      </NavLink>
      <NavLink to="/admin/bank-accounts" className={linkClasses}>
        <Landmark size={18} /> Tài khoản nhận tiền
      </NavLink>
      <NavLink to="/admin/penalty-appeals" className={linkClasses}>
        <Gavel size={18} /> Khiếu nại án phạt
      </NavLink>
      <NavLink to="/admin/complaint" className={linkClasses}>
        <MessageSquareWarning size={18} /> Xử lý khiếu nại
      </NavLink>
      <NavLink to="/admin/content-reports" className={linkClasses}>
        <ShieldAlert size={18} /> Báo cáo vi phạm
      </NavLink>
      {/* LỐI RA — trước đây vào trang quản trị rồi thì chỉ còn Đăng xuất, bấm Back, hoặc tự
          gõ URL mới ra được. Admin cần xem sản phẩm như khách thấy (kiểm một buổi diễn vừa
          duyệt chẳng hạn) thì không có đường nào. */}
      <div className="pt-2 mt-2 border-t border-line space-y-1.5">
        <Link to="/account" className={linkClasses({ isActive: false })}>
          <UserCog size={18} /> Tài khoản của tôi
        </Link>
        <Link to="/" className={linkClasses({ isActive: false })}>
          <ExternalLink size={18} /> Về trang công khai
        </Link>
      </div>
    </>
  )

  const footer = (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 min-h-[44px] w-full text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
    >
      <LogOut size={18} /> Đăng xuất
    </button>
  )

  return (
    <PortalShell
      portalName="Quản trị hệ thống"
      pageTitle="Quản trị MusicLounge"
      nav={nav}
      footer={footer}
      headerRight={
        <span className="w-9 h-9 bg-ink flex items-center justify-center text-lamp text-xs font-bold" aria-hidden="true">
          AD
        </span>
      }
    >
      <Outlet />
    </PortalShell>
  )
}

export default AdminLayout
