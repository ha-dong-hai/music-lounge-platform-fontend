// src/components/livestream/LivestreamScreens.jsx
// Ba màn full-page của trang xem livestream — thuần UI, không state, không logic.
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, Lock, ArrowLeft } from 'lucide-react'

export const LivestreamLoadingScreen = () => (
  <div className="min-h-screen bg-page flex items-center justify-center">
    <Loader2 size={40} className="animate-spin text-brand-text" />
  </div>
)

export const LivestreamErrorScreen = ({ message }) => (
  <div className="min-h-screen bg-page flex flex-col items-center justify-center text-ink">
    <AlertCircle size={40} className="text-danger mb-4" />
    <p className="text-xl mb-4">{message}</p>
    <Link to="/" className="text-brand-text underline flex items-center gap-2">
      <ArrowLeft size={16} /> Về trang chủ
    </Link>
  </div>
)

// Không có vé trực tuyến — different với màn lỗi: đây là người dùng hợp lệ thiếu quyền xem.
export const LivestreamAccessScreen = ({ showId }) => (
  <div className="min-h-screen bg-page flex flex-col items-center justify-center text-ink px-4 text-center">
    <Lock size={40} className="text-brand-text mb-4" />
    <p className="text-xl mb-2 font-bold">Bạn cần vé xem trực tuyến để vào buổi phát này</p>
    <p className="text-ink-soft mb-6">Hãy mua vé xem trực tuyến của buổi diễn này để mở khoá.</p>
    <Link to={`/shows/${showId}`} className="text-brand-text underline flex items-center gap-2">
      <ArrowLeft size={16} /> Quay lại buổi diễn
    </Link>
  </div>
)