// src/layouts/OwnerLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Building2, LogOut, CreditCard, Home, DollarSign, Music } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

const OwnerLayout = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-800 text-[#C3B665]'
        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    }`

  return (
    <div className="flex h-screen bg-black overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-950 text-white flex flex-col h-full flex-shrink-0 border-r border-gray-900">
        <div className="h-16 flex items-center px-6 border-b border-gray-900">
          <h1 className="text-xl font-bold tracking-wider text-[#C3B665]">OWNER PANEL</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-4">
          <NavLink to="/owner/revenue" className={linkClasses}>
            <DollarSign size={18} /> Dashboard doanh thu
          </NavLink>
          <NavLink to="/owner/lounges" className={linkClasses}>
            <Building2 size={18} /> Quản lý Lounge
          </NavLink>
          <NavLink to="/owner/shows" className={linkClasses}>
            <Music size={18} /> Quản lý Sự kiện
          </NavLink>
          <NavLink to="/owner/subscriptions" className={linkClasses}>
            <CreditCard size={18} /> Gói dịch vụ
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-900 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <Home size={18} /> Về trang chủ
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-500 hover:text-white hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-gray-950 border-b border-gray-900 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Owner Management</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user?.email || ''}</span>
            <div className="w-8 h-8 bg-[#C3B665] rounded-full flex items-center justify-center text-black text-xs font-bold">
              OW
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default OwnerLayout