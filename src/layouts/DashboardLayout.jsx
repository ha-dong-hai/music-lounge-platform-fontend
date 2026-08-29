// src/layouts/DashboardLayout.jsx
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, Music } from 'lucide-react'

const DashboardLayout = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* ================================ */}
      {/* SIDEBAR BÊN TRÁI                 */}
      {/* ================================ */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col h-full flex-shrink-0">
        
        {/* Logo Admin */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-widest text-white">TUNEROOM</h1>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-4">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gray-800 text-white">
            <LayoutDashboard size={18} /> Tổng quan
          </Link>
          <Link to="/dashboard/events" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Music size={18} /> Quản lý sự kiện
          </Link>
          <Link to="/dashboard/bookings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <CalendarDays size={18} /> Đơn đặt vé
          </Link>
          <Link to="/dashboard/users" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Users size={18} /> Khách hàng
          </Link>
        </nav>

        {/* Nút Đăng xuất ở cuối Sidebar */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* ================================ */}
      {/* VÙNG NỘI DUNG BÊN PHẢI           */}
      {/* ================================ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header Phụ của Admin */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Trang quản trị hệ thống</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Settings size={16} className="text-gray-600"/>
            </div>
          </div>
        </header>

        {/* Nội dung thay đổi theo Router */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default DashboardLayout