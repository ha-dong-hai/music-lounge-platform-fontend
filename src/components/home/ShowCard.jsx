// src/components/home/EventCard.jsx
import { CalendarDays, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { useState, useRef, useEffect } from 'react'
import { toggleWishlist } from '../../services/interactionServices'
import toast from 'react-hot-toast'

const ZOOM_DELAY = 600 // chỉnh thời gian hover cần thiết để poster mở rộng

// ẢNH DEFAULT khi event không có ảnh (dùng chung ảnh fallback với HeroBanner cho đồng bộ)
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop"

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

  // Nếu không có thumbnail thì dùng ảnh default
  const displayImage = thumbnail || DEFAULT_IMAGE

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

  const formattedDate = start_date ? dayjs(start_date).format('MMM D, h:mm A') : null

  // LOGIC MÀU TAG FORMAT
  const formatStyles = {
    Offline: 'bg-blue-500/80 text-white',
    Online: 'bg-purple-500/80 text-white',
    Hybrid: 'bg-green-500/80 text-white'
  }
  const formatClass = formatStyles[format] || 'bg-gray-500/80 text-white'

  // HÀM TOGGLE WISHLIST RIÊNG CHO CARD
  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const prev = wished
    setWished(!prev)
    try {
      await toggleWishlist(id, prev)
      toast.success(prev ? 'Remove from Wishlist!' : 'Added to Wishlist!')
      onWishlistChange?.(!prev)
    } catch (err) {
      setWished(prev)
      toast.error('Thao tác thất bại.')
    }
  }

  // Xử lý khi ảnh bị lỗi  → tự động thay bằng ảnh default
  const handleImgError = (e) => {
    e.target.onerror = null // tránh vòng lặp vô hạn nếu default image cũng lỗi
    e.target.src = DEFAULT_IMAGE
  }

  return (
    <Wrapper {...wrapperProps}>
      
      {/* === KHU VỰC ẢNH (trạng thái bình thường) === */}
      <div className="relative w-full aspect-video bg-gray-200 mt-2 rounded-xl overflow-hidden cursor-pointer">
        <img 
          src={displayImage} 
          alt={title} 
          className="w-full h-full object-cover" 
          loading="lazy"
          onError={handleImgError}
        />
        
        {/* TAG FORMAT GÓC TRÊN BÊN TRÁI */}
        {format && (
          <span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold ${formatClass} backdrop-blur-sm z-[5]`}>
            {format}
          </span>
        )}

        {/* NÚT WISHLIST — chỉ hiện khi hover card (đã wishlist thì hiện luôn) */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-2 right-2 z-30 p-1.5 rounded-full bg-black/50 backdrop-blur-sm transition-all duration-300 ${
            wished
              ? 'text-red-500 opacity-100'
              : 'text-white opacity-0 group-hover:opacity-100 hover:text-red-400 hover:scale-110'
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart size={16} className={wished ? 'fill-red-500' : ''} />
        </button>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* === KHU VỰC NỘI DUNG (trạng thái bình thường) === */}
      <div className="px-1 space-y-1.5 flex flex-col flex-1">
        <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-[#C3B665] transition-colors duration-200">
          {title}
        </h3>
        
        <p className="text-gray-400 text-sm">From {price}</p>
        
        <div className="mt-auto pt-2"></div>

        {formattedDate ? (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
            <CalendarDays size={14} className="flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs italic">
            <CalendarDays size={14} className="flex-shrink-0" />
            <span>No Date</span>
          </div>
        )}
      </div>

      {/* OVERLAY POSTER MỞ RỘNG — phủ TOÀN CARD sau khi hover đủ lâu */}
     
      <div 
        className={`absolute inset-0 z-20 rounded-xl overflow-hidden bg-gray-900 shadow-2xl transition-all duration-600 ease-out ${
          isZoomed 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-[1.06] pointer-events-none'
        }`}
      >
        <img 
          src={displayImage} 
          alt={title} 
          className="w-full h-full object-cover"
          onError={handleImgError}
        />

        {/* Gradient đọc chữ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none" />

        {/* Thông tin đè lên poster (pointer-events-none để click vẫn đi tới trang detail) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          {format && (
            <span className={`inline-block px-2 py-1 mb-2 rounded-md text-xs font-bold ${formatClass}`}>
              {format}
            </span>
          )}
          <h3 className="font-bold text-white leading-snug line-clamp-2 mb-1.5">{title}</h3>
          <p className="text-[#C3B665] text-sm font-medium mb-1.5">From {price}</p>
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-gray-300 text-xs font-medium">
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