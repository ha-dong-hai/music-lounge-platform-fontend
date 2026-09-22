import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Music, Package, LogOut, Users, Receipt, MessageSquareWarning, SlidersHorizontal, ShieldAlert, Banknote, Landmark, ShieldCheck, Settings2, TrendingUp, Gavel, ExternalLink, UserCog } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

const AdminLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    // Trước đây xoá key 'token'/'user' không khớp key thật ('musiclounge-auth') mà useAuthStore
    // dùng — bấm Logout không thực sự xoá session, token cũ vẫn được axios gắn vào request sau đó.
    logout()
    navigate('/login')
  }

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
      ? 'bg-sunken text-brand-text'
      : 'text-ink-soft hover:text-ink hover:bg-sunken/50'
    }`

  return (
    <div className="flex h-screen bg-page overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 bg-card text-ink flex flex-col h-full flex-shrink-0 border-r border-line">
        <div className="h-16 flex items-center px-6 border-b border-line">
          <h1 className="text-xl font-bold tracking-wider text-brand-text">ADMIN PORTAL</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-4">
          <NavLink to="/admin" end className={linkClasses}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/shows" className={linkClasses}>
            <Music size={18} /> Musical Shows
          </NavLink>
          <NavLink to="/admin/venues" className={linkClasses}>
            <Music size={18} /> Venues
          </NavLink>
          <NavLink to="/admin/filter-options" className={linkClasses}>
            <SlidersHorizontal size={20} />
            <span>Filter Options</span>
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
            <Users size={18} /> Account management
          </NavLink>
          <NavLink to="/admin/packages" className={linkClasses}>
            <Package size={18} /> Package
          </NavLink>
          <NavLink to="/admin/refunds" className={linkClasses}>
            <Banknote size={18} /> Hoàn tiền
          </NavLink>
          <NavLink to="/admin/settlements" className={linkClasses}>
            <Landmark size={18} /> Quyết toán
          </NavLink>
          <NavLink to="/admin/ledger" className={linkClasses}>
            <Receipt size={18} /> Sổ cái (Ledger)
          </NavLink>
          <NavLink to="/admin/bank-accounts" className={linkClasses}>
            <Landmark size={18} /> Tài khoản nhận tiền
          </NavLink>
          <NavLink to="/admin/penalty-appeals" className={linkClasses}>
            <Gavel size={18} /> Khiếu nại án phạt
          </NavLink>
          <NavLink to="/admin/complaint" className={linkClasses}>
            <MessageSquareWarning size={18} /> Report
          </NavLink>
          <NavLink to="/admin/content-reports" className={linkClasses}>
            <ShieldAlert size={18} /> Báo cáo vi phạm
          </NavLink>
          {/* LỐI RA — trước đây vào trang quản trị rồi thì chỉ còn Đăng xuất, bấm Back, hoặc tự
              gõ URL mới ra được. Admin cần xem sản phẩm như khách thấy (kiểm một buổi diễn vừa
              duyệt chẳng hạn) thì không có đường nào. */}
          <div className="pt-2 mt-2 border-t border-line space-y-2">
            <Link to="/account" className={linkClasses({ isActive: false })}>
              <UserCog size={18} /> Tài khoản của tôi
            </Link>
            <Link to="/" className={linkClasses({ isActive: false })}>
              <ExternalLink size={18} /> Về trang công khai
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-line">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-danger hover:text-ink hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-card border-b border-line flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-semibold text-ink">Hệ thống quản trị Music Lounge</h2>
          <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-on-brand text-xs font-bold">
            AD
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout