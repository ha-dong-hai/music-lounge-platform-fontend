// src/components/home/EventCard.jsx
import { CalendarDays, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { useState, useRef, useEffect } from 'react'
import { toggleWishlist } from '../../services/interactionServices'
import toast from 'react-hot-toast'
import CoverFallback from '../shared/CoverFallback'

const ZOOM_DELAY = 600 // chỉnh thời gian hover cần thiết để poster mở rộng

const ShowCard = ({
  id, 
  title, 
  price, 
  location,       
  thumbnail,
  start_date,
  format,          
  isWishlisted = false,
  onWishlistChange
}) => {
  const [wished, setWished] = useState(isWishlisted)
  
  // STATE ZOOM POSTER (hover đủ lâu)
  const [isZoomed, setIsZoomed] = useState(false)
  const zoomTimerRef = useRef(null)

  // Dọn timer khi unmount (tránh memory leak / setState trên component đã chết)
  useEffect(() => () => clearTimeout(zoomTimerRef.current), [])

  // Ảnh lỗi (404, hết hạn CDN...) rơi về CÙNG hoạ tiết dự phòng như lúc không có ảnh — xem
  // src/components/shared/CoverFallback.jsx để biết vì sao không dùng ảnh stock ở đây nữa.
  const [imgFailed, setImgFailed] = useState(false)
  const showFallback = !thumbnail || imgFailed

  const handleMouseEnter = () => {
    // Bắt đầu đếm: đủ ZOOM_DELAY mới mở rộng poster
    zoomTimerRef.current = setTimeout(() => setIsZoomed(true), ZOOM_DELAY)
  }

  const handleMouseLeave = () => {
    // Rời chuột: hủy đếm + thu poster lại NGAY (fade out mượt)
    clearTimeout(zoomTimerRef.current)
    setIsZoomed(false)
  }

  const Wrapper = id ? Link : 'article'
  const wrapperProps = id 
    ? { 
        to: `/shows/${id}`, 
        className: "group relative flex flex-col gap-3 h-full cursor-pointer hover:z-10", 
        onMouseEnter: handleMouseEnter, 
        onMouseLeave: handleMouseLeave 
      } 
    : { 
        className: "group relative flex flex-col gap-3 h-full hover:z-10",
        onMouseEnter: handleMouseEnter, 
        onMouseLeave: handleMouseLeave 
      }

  const formattedDate = start_date ? dayjs(start_date).format('HH:mm, DD/MM/YYYY') : null

  // LOGIC MÀU TAG FORMAT
  const formatStyles = {
    Offline: 'bg-espresso/85 text-cream',
    Online: 'bg-brand text-on-brand',
    Hybrid: 'bg-card/95 text-ink border border-line'
  }
  const nhanHinhThuc = { Offline: 'Tại chỗ', Online: 'Trực tuyến', Hybrid: 'Kết hợp' }[format] || format
  const formatClass = formatStyles[format] || 'bg-card/95 text-ink'

  // HÀM TOGGLE WISHLIST RIÊNG CHO CARD
  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const prev = wished
    setWished(!prev)
    try {
      await toggleWishlist(id, prev)
      toast.success(prev ? 'Đã bỏ khỏi danh sách yêu thích' : 'Đã thêm vào yêu thích')
      onWishlistChange?.(!prev)
    } catch {
      setWished(prev)
      toast.error('Thao tác thất bại, thử lại sau.')
    }
  }

  return (
    <Wrapper {...wrapperProps}>
      
      {/* === KHU VỰC ẢNH (trạng thái bình thường) ===
          Viền chỉ (hairline) thay cho đổ bóng cứng, và scale-105 chậm khi hover — cùng ngôn ngữ với
          Aura & Echo (docs/design/TRANG-CHU-BRIEF.md §3, §5): độ sâu tới từ chuyển động tinh tế, không
          phải shadow nặng. */}
      <div className="relative w-full aspect-video bg-sunken mt-2 rounded-xl overflow-hidden cursor-pointer border border-line">
        {showFallback ? (
          <CoverFallback className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-105" />
        ) : (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}

        {/* TAG FORMAT GÓC TRÊN BÊN TRÁI */}
        {format && (
          <span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold ${formatClass} backdrop-blur-sm z-[5]`}>
            {nhanHinhThuc}
          </span>
        )}

        {/* NÚT WISHLIST — chỉ hiện khi hover card (đã wishlist thì hiện luôn) */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-2 right-2 z-30 p-1.5 rounded-full bg-espresso/50 backdrop-blur-sm transition-all duration-300 ${
            wished
              ? 'text-danger opacity-100'
              : 'text-ink opacity-0 group-hover:opacity-100 hover:text-danger hover:scale-110'
          }`}
          aria-label={wished ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
        >
          <Heart size={16} className={wished ? 'fill-red-500' : ''} />
        </button>

        <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/5 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* === KHU VỰC NỘI DUNG (trạng thái bình thường) === */}
      <div className="px-1 space-y-1.5 flex flex-col flex-1">
        <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-brand-text transition-colors duration-200">
          {title}
        </h3>
        
        <p className="text-ink-soft text-sm">Từ {price}</p>
        
        <div className="mt-auto pt-2"></div>

        {formattedDate ? (
          <div className="flex items-center gap-1.5 text-ink-soft text-xs font-medium">
            <CalendarDays size={14} className="flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-ink-mute text-xs italic">
            <CalendarDays size={14} className="flex-shrink-0" />
            <span>Chưa có lịch</span>
          </div>
        )}
      </div>

      {/* OVERLAY POSTER MỞ RỘNG — phủ TOÀN CARD sau khi hover đủ lâu */}
     
      <div
        className={`absolute inset-0 z-20 rounded-xl overflow-hidden bg-card border border-line-strong transition-all duration-[600ms] ease-out ${
          isZoomed
            ? 'opacity-100 scale-100 shadow-glow'
            : 'opacity-0 scale-[1.06] pointer-events-none'
        }`}
      >
        {showFallback ? (
          <CoverFallback className="w-full h-full" />
        ) : (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        )}

        {/* Gradient đọc chữ */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/25 to-transparent pointer-events-none" />

        {/* Thông tin đè lên poster (pointer-events-none để click vẫn đi tới trang detail) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          {format && (
            <span className={`inline-block px-2 py-1 mb-2 rounded-md text-xs font-bold ${formatClass}`}>
              {nhanHinhThuc}
            </span>
          )}
          <h3 className="font-bold text-cream leading-snug line-clamp-2 mb-1.5">{title}</h3>
          <p className="text-brand-on-dark text-sm font-medium mb-1.5">Từ {price}</p>
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-cream-mute text-xs font-medium">
              <CalendarDays size={13} className="flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  )
}

export default ShowCard