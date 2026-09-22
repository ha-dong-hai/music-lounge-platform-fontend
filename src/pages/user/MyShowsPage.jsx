// src/pages/user/MyShowsPage.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import TicketsTab from '../../components/myshows/TicketsTab'
import WishlistTab from '../../components/myshows/WishlistTab'
import IncomingTransfersTab from '../../components/myshows/IncomingTransfersTab'
import RefundRequestsTab from '../../components/myshows/RefundRequestsTab'
import MyDonationsTab from '../../components/myshows/MyDonationsTab'

const MyShowsPage = () => {
  const { user } = useAuthStore()
  const [activeMainTab, setActiveMainTab] = useState('shows')

  return (
    <div className="min-h-[60vh] bg-page text-ink pb-20">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-brand-text transition-colors">
            <ArrowLeft size={18} /> Về trang chủ
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Ticket size={28} className="text-brand-text" />
          <h1 className="text-3xl font-bold text-ink">Danh sách của tôi</h1>
        </div>

        {!user ? (
          <div className="bg-card border border-line rounded-2xl p-12 text-center">
            <p className="text-lg font-semibold text-ink mb-2">Bạn cần đăng nhập.</p>
            <p className="text-ink-soft mb-6">Vui lòng đăng nhập để xem vé và danh sách yêu thích.</p>
            <Link to="/login" className="inline-block bg-brand text-on-brand px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-hover transition-colors">Đăng nhập ngay</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 border-b border-line">
              <div className="flex justify-end gap-8">
                <button onClick={() => setActiveMainTab('shows')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'shows' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}>Vé</button>
                <button onClick={() => setActiveMainTab('wishlist')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'wishlist' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}>Yêu thích</button>
                <button onClick={() => setActiveMainTab('transfers')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'transfers' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}>Vé chuyển đến</button>
                <button onClick={() => setActiveMainTab('refunds')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'refunds' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}>Hoàn tiền</button>
                <button onClick={() => setActiveMainTab('donations')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'donations' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}>Ủng hộ</button>
              </div>
            </div>

            {/* MỖI TAB TỰ QUẢN LÝ STATE + API RIÊNG */}
            {activeMainTab === 'shows' && <TicketsTab />}
            {activeMainTab === 'wishlist' && <WishlistTab />}
            {activeMainTab === 'transfers' && <IncomingTransfersTab />}
            {activeMainTab === 'refunds' && <RefundRequestsTab />}
            {activeMainTab === 'donations' && <MyDonationsTab />}
          </>
        )}
      </div>
    </div>
  )
}

export default MyShowsPage