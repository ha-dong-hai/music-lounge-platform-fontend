// src/components/program/ThePhongTra.jsx
//
// THẺ PHÒNG TRÀ — một ô chương trình trên giấy (DESIGN.md › Thẻ phòng trà). Dùng chung cho khối "Phòng trà trên sàn"
// ở trang chủ và trang danh sách phòng trà: tách ra để hai nơi không thể vẽ hai kiểu thẻ khác nhau cho cùng một thứ.
//
// - Ảnh không gian thật (`primaryImageUrl`); chưa có hoặc tải hỏng thì ô "Chưa có ảnh" của trang — không ảnh kho.
// - `sangDen`: phòng trà có diễn đêm nay → ô sáng đèn (khối mực, chữ sáng), cùng tín hiệu với bảng giờ diễn.
// - Theo dõi NGAY TRÊN THẺ, luôn hiện, cao 44px. Chưa đăng nhập: nút nói trước là cần đăng nhập và dẫn tới /login
//   kèm nơi quay lại (`tuTrang`).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import CoverFallback from '../shared/CoverFallback'

const ThePhongTra = ({ l, sangDen = false, daDangNhap = false, dangTheoDoi = false, dangBam = false, onTheoDoi, tuTrang = '/' }) => {
  const [anhHong, setAnhHong] = useState(false)
  const noi = [l.district, l.city].filter(Boolean).join(', ') || l.street || '—'
  return (
    <li className={`flex flex-col border-2 border-ink ${sangDen ? 'bg-ink text-lamp shadow-glow' : 'bg-stock text-ink'}`}>
      <Link to={`/lounge/${l.id}`} className="block m-3 mb-0 aspect-[4/3] overflow-hidden border border-ink bg-board" tabIndex={-1} aria-hidden="true">
        {l.primaryImageUrl && !anhHong
          ? <img src={l.primaryImageUrl} alt="" loading="lazy" width="400" height="300" onError={() => setAnhHong(true)} className="w-full h-full object-cover" />
          : <CoverFallback />}
      </Link>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <Link to={`/lounge/${l.id}`} className={`font-display text-3xl leading-none break-words hover:underline ${sangDen ? 'text-lamp' : 'text-ink'}`}>{l.name}</Link>
        <p className={`flex items-center gap-1 text-sm ${sangDen ? 'text-lamp-mute' : 'text-ink-soft'}`}>
          <MapPin size={13} className="flex-shrink-0" aria-hidden="true" /> {noi}
        </p>
        <p className={`font-mono text-sm ${sangDen ? 'text-lamp' : 'text-ink'}`}>
          {sangDen ? 'Có diễn đêm nay' : l.upcomingShowCount > 0 ? `${l.upcomingShowCount} đêm diễn sắp tới` : 'Chưa có đêm diễn mới'}
        </p>
        <div className="mt-auto pt-2">
          {daDangNhap ? (
            <button type="button" onClick={() => onTheoDoi?.(l)} disabled={dangBam} aria-pressed={dangTheoDoi}
              aria-label={dangTheoDoi ? `Đang theo dõi ${l.name}` : `Theo dõi ${l.name}`}
              className={`w-full min-h-[44px] border-2 font-semibold transition-colors disabled:opacity-60 ${sangDen
                ? (dangTheoDoi ? 'bg-lamp text-ink border-lamp' : 'border-lamp text-lamp hover:bg-lamp hover:text-ink')
                : (dangTheoDoi ? 'bg-ink text-lamp border-ink' : 'border-ink text-ink hover:bg-ink hover:text-lamp')}`}>
              {dangTheoDoi ? 'Đang theo dõi' : 'Theo dõi'}
            </button>
          ) : (
            <Link to="/login" state={{ from: tuTrang }}
              className={`flex items-center justify-center w-full min-h-[44px] border-2 font-semibold ${sangDen ? 'border-lamp text-lamp' : 'border-ink text-ink'}`}>
              Đăng nhập để theo dõi
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}

export default ThePhongTra
