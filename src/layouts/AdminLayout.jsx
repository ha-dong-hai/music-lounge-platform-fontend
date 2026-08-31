import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Music, Package, LogOut, Users, Receipt, MessageSquareWarning } from 'lucide-react'

const AdminLayout = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
            <Music size={18} /> Chương trình âm nhạc
          </NavLink>
          <NavLink to="/admin/accounts" className={linkClasses}>
            <Users size={18} /> Quản lý tài khoản
          </NavLink>
          <NavLink to="/admin/packages" className={linkClasses}>
            <Package size={18} /> Gói Package
          </NavLink>
          <NavLink to="/admin/ledger" className={linkClasses}>
            <Receipt size={18} /> Sổ cái (Ledger)
          </NavLink>
          <NavLink to="/admin/complaint" className={linkClasses}>
            <MessageSquareWarning size={18} /> Phàn nàn (Complaint)
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-900">
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