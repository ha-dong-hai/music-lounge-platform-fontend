import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Share2, ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react'
import { FormatBadge, StatusBadge } from '../shows/ShowBadges'

// Component thuần UI: hiển thị hero, callback khi bấm nút duyệt / share
const AdminShowHero = ({ data, moderation, onOpenModeration, onOpenShare }) => {
  return (
    <div className="relative w-full h-[420px] md:h-[600px] bg-gray-900 flex items-end md:items-center">
      {data.posterImage && <img src={data.posterImage} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/60 to-transparent"></div>

      {/* Nút về trang quản lý */}
      <Link to="/admin/shows" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-medium text-gray-300 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:border-[#C3B665] hover:text-[#C3B665] transition-colors">
        <ArrowLeft size={16} /> Về quản lý
      </Link>

      {/* Badge Admin View */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-500/40 text-purple-300 text-xs font-bold">
        <ShieldAlert size={14} /> ADMIN VIEW
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 pb-10 md:pb-0">
        <div className="flex flex-col items-start max-w-2xl text-white">

          <div className="flex items-center gap-2 mb-6 text-[#C3B665] font-medium">
            <CalendarDays size={20} /><span className="text-sm md:text-base">{data.dateStr}</span>
          </div>

          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-900 mb-4 overflow-hidden border-2 border-[#C3B665] shadow-lg">
            <img src={data.loungeLogo} alt="Logo" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-white drop-shadow-md">{data.title}</h1>

          <div className="flex items-center gap-2 mb-4 text-gray-400">
            <MapPin size={18} className="flex-shrink-0 text-[#C3B665]" /><span className="text-lg">{data.address}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <FormatBadge format={data.format} />
            <StatusBadge status={data.status} />
          </div>

          {/* ⭐ NÚT CHÍNH: có pending → mở modal duyệt | không → link xem trang khán giả */}
          {moderation ? (
            <button 
              onClick={onOpenModeration}
              className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl mb-6 w-full md:w-auto flex items-center gap-2 animate-pulse"
            >
              <ShieldAlert size={20} /> Nội dung chờ duyệt — Xử lý ngay
            </button>
          ) : (
            <Link 
              to={`/shows/${data.id}`} 
              target="_blank"
              className="bg-[#C3B665] text-black hover:bg-[#d4c87f] px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl mb-6 w-full md:w-auto"
            >
              Xem trang khán giả
            </Link>
          )}

          <div className="flex items-center gap-6">
            <button onClick={onOpenShare} className="flex items-center gap-2 text-gray-400 hover:text-[#C3B665] transition-colors">
              <Share2 size={20} /><span className="font-medium text-sm md:text-base">Share</span>
            </button>
            {moderation && (
              <span className="text-sm text-yellow-400 font-medium flex items-center gap-1.5">
                <AlertTriangle size={16} /> Đang chờ quyết định Admin
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminShowHero