import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ShowCard from './ShowCard'
import { Link } from 'react-router-dom'

const ShowCarousel = ({ title, events = [], showViewMore = false, viewMoreLink = "#"}) => {
  const [scrollIndex, setScrollIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(4) // Mặc định desktop
  
  // ⭐ HÀM TÍNH SỐ CỘT HIỂN THỊ
  const calcVisibleCount = () => {
    if (typeof window === 'undefined') return 4
    const w = window.innerWidth
    if (w >= 1536) return 5      // 2XL: 5 cards
    if (w >= 1280) return 4      // XL: 4 cards
    if (w >= 1024) return 3      // LG: 3 cards
    if (w >= 640) return 2       // SM: 2 cards
    return 1.5                   // Mobile: 1.5 cards (hiệu ứng peek thấy nửa card sau)
  }

  // ⭐ LẮNG NGHE SỰ KIỆN RESIZE MÀN HÌNH TỪ TRÌNH DUYỆT
  useEffect(() => {
    const handleResize = () => {
      const newCount = calcVisibleCount()
      setVisibleCount(newCount)
      
      // Tự động lùi scrollIndex nếu thu nhỏ màn hình làm mất view hiện tại
      const newMaxIdx = Math.max(0, Math.ceil(events.length - newCount))
      setScrollIndex(prev => prev > newMaxIdx ? newMaxIdx : prev)
    }

    // Gọi 1 lần ngay khi mount
    handleResize()

    window.addEventListener('resize', handleResize)
    // Dọn dẹp listener khi unmount tránh leak memory
    return () => window.removeEventListener('resize', handleResize)
  }, [events.length])

  // Tính toán max index (làm tròn lên để xử lý trường hợp 1.5 card)
  const maxIdx = Math.max(0, Math.ceil(events.length - visibleCount))
  
  const canScrollLeft = scrollIndex > 0
  const canScrollRight = scrollIndex < maxIdx
  const hasOverflow = events.length > visibleCount
  
  const showLeftGradient = hasOverflow && canScrollLeft
  const showRightGradient = hasOverflow && canScrollRight

  return (
    <div className="w-full select-none">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        
        {showViewMore && (
          <Link 
            to={viewMoreLink} 
            className="text-sm font-medium text-[#C3B665]/85 hover:text-[#C3B665] hover:font-bold flex items-center justify-end gap-1 transition-all hover:gap-2"
          >
            See more
            <ChevronRight size={20} />
          </Link>
        )}
      </div>

      {/* BODY CONTAINER */}
      <div className="relative w-full group/carousel">
        
        {/* NÚT MŨI TÊN TRÁI */}
        {canScrollLeft && (
          <button 
            onClick={(e) => { e.stopPropagation(); setScrollIndex(p => Math.max(0, p - 1)) }}
            className="
              absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-20
              w-9 h-9 md:w-11 md:h-11 rounded-lg 
              bg-black/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/10
              flex items-center justify-center text-white 
              
              hover:bg-[#C3B665] hover:text-black hover:border-[#C3B665] active:scale-95
              
              opacity-0 -translate-x-2 transition-all duration-300 ease-out
              group-hover/carousel:opacity-100 group-hover/carousel:translate-x-0
              cursor-pointer
            "
            aria-label="Previous"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        )}

        {/* SCROLL AREA */}
        <div className="overflow-hidden px-1 relative z-[1] bg-transparent">
          <div 
            className="flex transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translateX(-${scrollIndex * (100 / visibleCount)}%)` }}
          >
            {events.map((ev, i) => (
              <div 
                key={ev.id || i} 
                className="flex-shrink-0 px-2 md:px-3" 
                style={{ width: `${100 / visibleCount}%` }}
              >
                <ShowCard {...ev} />
              </div>
            ))}
          </div>
        </div>

        {/* NÚT MŨI TÊN PHẢI */}
        {canScrollRight && (
          <button 
            onClick={(e) => { e.stopPropagation(); setScrollIndex(p => Math.min(maxIdx, p + 1)) }}
            className="
              absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-20
              w-9 h-9 md:w-11 md:h-11 rounded-lg 
              bg-black/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/10
              flex items-center justify-center text-white 
              
              hover:bg-[#C3B665] hover:text-black hover:border-[#C3B665] active:scale-95
              
              opacity-0 translate-x-2 transition-all duration-300 ease-out
              group-hover/carousel:opacity-100 group-hover/carousel:translate-x-0
              cursor-pointer
            "
            aria-label="Next"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        )}

        {/* GRADIENT BÊN TRÁI */}
        {showLeftGradient && (
          <div className="
            absolute inset-y-0 left-0 w-12 md:w-20 pointer-events-none z-10 
            bg-gradient-to-r from-black via-black/30 to-transparent 
            opacity-0 transition-opacity duration-500 group-hover/carousel:opacity-100" 
          />
        )}

        {/* GRADIENT BÊN PHẢI */}
        {showRightGradient && (
          <div className="
            absolute inset-y-0 right-0 w-12 md:w-20 pointer-events-none z-10 
            bg-gradient-to-l from-black via-black/30 to-transparent 
            opacity-0 group-hover/carousel:opacity-100"
          />
        )}

      </div>
    </div>
  )
}

export default ShowCarousel