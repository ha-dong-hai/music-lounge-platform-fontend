// src/pages/user/MyShowsPage.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import TicketsTab from '../../components/myshows/TicketsTab'
import WishlistTab from '../../components/myshows/WishlistTab'

const MyShowsPage = () => {
  const { user } = useAuthStore()
  const [activeMainTab, setActiveMainTab] = useState('shows')

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#C3B665] transition-colors">
            <ArrowLeft size={18} /> Quay lại trang chủ
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Ticket size={28} className="text-[#C3B665]" />
          <h1 className="text-3xl font-bold text-white">Danh sách của tôi</h1>
        </div>

        {!user ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <p className="text-lg font-semibold text-white mb-2">Bạn chưa đăng nhập</p>
            <p className="text-gray-400 mb-6">Vui lòng đăng nhập để xem danh sách vé và wishlist của bạn.</p>
            <Link to="/login" className="inline-block bg-[#C3B665] text-black px-6 py-2.5 rounded-lg font-semibold hover:bg-[#d4c87f] transition-colors">Đăng nhập ngay</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 border-b border-gray-800">
              <div className="flex justify-end gap-8">
                <button onClick={() => setActiveMainTab('shows')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'shows' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Shows</button>
                <button onClick={() => setActiveMainTab('wishlist')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'wishlist' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Wishlist</button>
              </div>
            </div>

            {/* MỖI TAB TỰ QUẢN LÝ STATE + API RIÊNG */}
            {activeMainTab === 'shows' && <TicketsTab />}
            {activeMainTab === 'wishlist' && <WishlistTab />}
          </>
        )}
      </div>
    </div>
  )
}

export default MyShowsPage