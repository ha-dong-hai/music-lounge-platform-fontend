// src/layouts/OwnerLayout.jsx
// GHI CHÚ CHO ĐỘI FE: layout phỏng theo AdminLayout.jsx. Chỉ thêm mục nav khi trang đã thật sự
// tồn tại, tránh link chết.
// ĐÃ CÓ: buổi diễn (tạo/sửa/gửi duyệt + line-up + hạng vé), vận hành livestream, báo cáo doanh thu,
// gói dịch vụ.
// CHƯA CÓ: thực đơn F&B + màn bếp xử lý đơn, tài khoản nhận tiền (payout), quản lý nhân viên,
// hồ sơ phòng trà, khu vực/zone, tour 360°, donate phía chủ, án phạt venue. Backend đã có đủ API —
// xem FnbMenusController, BankAccountsController, LoungesController, DonationsController,
// VenuePenaltiesController.
import { Outlet, NavLink } from 'react-router-dom'
import { Radio, LogOut, Package, BarChart3, CalendarDays, Store, Landmark, ScanLine, UtensilsCrossed, BookOpen, Mic2, Users, HeartHandshake, ShieldAlert, LayoutGrid } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const OwnerLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  // Staff chỉ vận hành được livestream (RequireVenueOperator). Buổi diễn, báo cáo doanh thu và
  // gói dịch vụ gọi endpoint RequireOwner — không hiện cửa mà Staff bấm vào sẽ bị đẩy ra.
  // Phải khớp với guard từng route trong AppRouter.jsx.
  const isOwner = useAuthStore((s) => s.user?.role) === 'Owner'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
      ? 'bg-gray-800 text-[#C3B665]'
      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    }`

  return (
    <div className="flex h-screen bg-black overflow-hidden">

      <aside className="w-64 bg-gray-950 text-white flex flex-col h-full flex-shrink-0 border-r border-gray-900">
        <div className="h-16 flex items-center px-6 border-b border-gray-900">
          <h1 className="text-xl font-bold tracking-wider text-[#C3B665]">OWNER PORTAL</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-4">
          {isOwner && (
            <NavLink to="/owner/lounge" className={linkClasses}>
              <Store size={18} /> Hồ sơ phòng trà
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/owner/zones" className={linkClasses}>
              <LayoutGrid size={18} /> Khu vực chỗ ngồi
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/owner/performers" className={linkClasses}>
              <Mic2 size={18} /> Nghệ sĩ
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/owner/staff" className={linkClasses}>
              <Users size={18} /> Nhân viên
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/owner/fnb-menus" className={linkClasses}>
              <BookOpen size={18} /> Thực đơn
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/owner/shows" className={linkClasses}>
              <CalendarDays size={18} /> Buổi diễn
            </NavLink>
          )}
          {/* Nhân viên dùng được: soát vé, bán vé quầy, bắt đầu/kết thúc đều là RequireVenueOperator */}
          <NavLink to="/owner/operate" className={linkClasses}>
            <ScanLine size={18} /> Vận hành đêm diễn
          </NavLink>
          <NavLink to="/owner/fnb-orders" className={linkClasses}>
            <UtensilsCrossed size={18} /> Đơn gọi món
          </NavLink>
          <NavLink to="/owner/livestreams" className={linkClasses}>
            <Radio size={18} /> Livestreams
          </NavLink>
          {isOwner && (
            <>
              <NavLink to="/owner/donations" className={linkClasses}>
                <HeartHandshake size={18} /> Tiền donate
              </NavLink>
              <NavLink to="/owner/penalties" className={linkClasses}>
                <ShieldAlert size={18} /> Án phạt
              </NavLink>
              <NavLink to="/owner/analytics" className={linkClasses}>
                <BarChart3 size={18} /> Báo cáo doanh thu
              </NavLink>
              <NavLink to="/owner/bank-accounts" className={linkClasses}>
                <Landmark size={18} /> Tài khoản nhận tiền
              </NavLink>
              <NavLink to="/owner/subscription" className={linkClasses}>
                <Package size={18} /> Gói dịch vụ
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-900">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-500 hover:text-white hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-gray-950 border-b border-gray-900 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Quản lý vận hành phòng trà</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default OwnerLayout
