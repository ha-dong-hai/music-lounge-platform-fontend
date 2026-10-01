import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Share2, ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react'
import { FormatBadge, StatusBadge } from '../shows/ShowBadges'

// Component thuần UI: hiển thị hero, callback khi bấm nút duyệt / share
// 30/09/2026: bỏ ô logo lấy từ api.dicebear.com (vòng chữ cái nền xanh lục, gọi dịch vụ ngoài mỗi lần mở — đã bỏ ở trang
// buổi diễn của khán giả vì cùng lý do); chữ trên ảnh là chữ sáng trên lớp phủ sơn then; bỏ nhấp nháy ở nút duyệt.
const AdminShowHero = ({ data, moderation, onOpenModeration, onOpenShare }) => {
  return (
    <div className="relative w-full h-[420px] md:h-[600px] bg-card flex items-end md:items-center">
      {data.posterImage && <img src={data.posterImage} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-board/75"></div>

      {/* Nút về trang quản lý */}
      <Link to="/admin/shows" className="absolute top-6 left-6 z-20 flex items-center gap-2 min-h-[44px] text-sm font-semibold text-lamp bg-board/80 px-4 border border-lamp/40 hover:bg-lamp hover:text-board transition-colors">
        <ArrowLeft size={16} aria-hidden="true" /> Danh sách buổi diễn
      </Link>

      {/* Badge Admin View */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 min-h-[32px] bg-lamp text-board text-sm font-semibold">
        <ShieldAlert size={14} aria-hidden="true" /> Chế độ quản trị
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 pb-10 md:pb-0">
        <div className="flex flex-col items-start max-w-2xl text-lamp">

          <div className="flex items-center gap-2 mb-6 text-stock font-medium">
            <CalendarDays size={20} /><span className="text-sm md:text-base">{data.dateStr}</span>
          </div>

          <h1 className="text-4xl md:text-5xl leading-[1.05] mb-4 text-lamp">{data.title}</h1>

          <div className="flex items-center gap-2 mb-4 text-stock/90">
            <MapPin size={18} className="flex-shrink-0 text-stock" /><span className="text-lg">{data.address}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <FormatBadge format={data.format} />
            <StatusBadge status={data.status} />
          </div>

          {/* ⭐ NÚT CHÍNH: có pending → mở modal duyệt | không → link xem trang khán giả */}
          {moderation ? (
            <button 
              onClick={onOpenModeration}
              className="bg-lamp text-board hover:bg-stock px-8 min-h-[52px] text-base md:text-lg font-bold transition-colors mb-6 w-full md:w-auto flex items-center gap-2"
            >
              <ShieldAlert size={20} /> Đang chờ duyệt — xử lý ngay
            </button>
          ) : (
            <Link 
              to={`/shows/${data.id}`} 
              target="_blank"
              className="inline-flex items-center bg-lamp text-board hover:bg-stock px-8 min-h-[52px] text-base md:text-lg font-bold transition-colors mb-6 w-full md:w-auto"
            >
              Xem trang khán giả
            </Link>
          )}

          <div className="flex items-center gap-6">
            <button type="button" onClick={onOpenShare} className="inline-flex items-center gap-2 min-h-[44px] text-stock/90 hover:text-stock transition-colors">
              <Share2 size={20} /><span className="font-medium text-sm md:text-base">Chia sẻ</span>
            </button>
            {moderation && (
              <span className="text-sm text-lamp font-semibold flex items-center gap-1.5">
                <AlertTriangle size={16} /> Chờ Admin quyết định
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminShowHero