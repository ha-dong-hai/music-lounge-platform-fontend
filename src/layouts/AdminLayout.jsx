import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Music, Package, LogOut, Users, Receipt, MessageSquareWarning, SlidersHorizontal, ShieldAlert, Banknote, Landmark } from 'lucide-react'
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
      ? 'bg-gray-800 text-[#C3B665]'
      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    }`

  return (
    <div className="flex h-screen bg-black overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-950 text-white flex flex-col h-full flex-shrink-0 border-r border-gray-900">
        <div className="h-16 flex items-center px-6 border-b border-gray-900">
          <h1 className="text-xl font-bold tracking-wider text-[#C3B665]">ADMIN PORTAL</h1>
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
          <NavLink to="/admin/complaint" className={linkClasses}>
            <MessageSquareWarning size={18} /> Report
          </NavLink>
          <NavLink to="/admin/content-reports" className={linkClasses}>
            <ShieldAlert size={18} /> Báo cáo vi phạm
          </NavLink>
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

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-gray-950 border-b border-gray-900 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Hệ thống quản trị Music Lounge</h2>
          <div className="w-8 h-8 bg-[#C3B665] rounded-full flex items-center justify-center text-black text-xs font-bold">
            AD
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout