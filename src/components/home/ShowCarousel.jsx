import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ShowCard from './ShowCard'
import { Link } from 'react-router-dom'

const ShowCarousel = ({ title, events = [], showViewMore = false, viewMoreLink = "#" }) => {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // HÀM KIỂM TRA VỊ TRÍ CUỘN
  const checkScrollPosition = () => {
    const el = scrollRef.current
    if (!el) return

    const { scrollLeft, clientWidth, scrollWidth } = el
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
  }

  // CHẠY KHI MOUNT, KHI EVENTS THAY ĐỔI VÀ KHI RESIZE MÀN HÌNH
  useEffect(() => {
    checkScrollPosition()
    window.addEventListener('resize', checkScrollPosition)
    return () => window.removeEventListener('resize', checkScrollPosition)
  }, [events])

  // HÀM XỬ LÝ CUỘN KHI BẤM NÚT
  const scroll = (direction) => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.8
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

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

      {/* BODY CONTAINER - group/carousel để hover toàn khối */}
      <div className="relative w-full group/carousel">

        {/* GRADIENT TRÁI */}
        <div className={`
          absolute inset-y-0 left-0 w-12 md:w-20 pointer-events-none z-10 
          bg-gradient-to-r from-black via-black/30 to-transparent 
          transition-opacity duration-300
          ${canScrollLeft ? 'opacity-0 group-hover/carousel:opacity-100' : 'opacity-0'}
        `} />

        {/* NÚT MŨI TÊN TRÁI */}
        <button
          onClick={() => scroll('left')}
          className={`
            absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-20 
            w-9 h-9 md:w-11 md:h-11 rounded-lg 
            bg-black/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/10 
            flex items-center justify-center text-white 
            hover:bg-[#C3B665] hover:text-black hover:border-[#C3B665] active:scale-95 
            transition-all duration-300 cursor-pointer
            
            /* Nếu cuộn được: ẩn mặc định, hiện khi hover khối cha. Nếu không cuộn được: ẩn vĩnh viễn */
            ${canScrollLeft
              ? 'opacity-0 -translate-x-2 group-hover/carousel:opacity-100 group-hover/carousel:translate-x-0'
              : 'opacity-0 pointer-events-none'
            }
          `}
          aria-label="Previous"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        {/* KHU VỰC SCROLL SNAP */}
        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar gap-x-3 md:gap-x-6 pb-4"
        >
          {events.map((ev, i) => (
            <div
              key={ev.id || i}
              className="snap-start flex-shrink-0 w-[80%] sm:w-1/2 lg:w-1/3 xl:w-1/4 2xl:w-1/5"
            >
              <ShowCard {...ev} />
            </div>
          ))}
        </div>

        {/* GRADIENT PHẢI */}
        <div className={`
          absolute inset-y-0 right-0 w-12 md:w-20 pointer-events-none z-10 
          bg-gradient-to-l from-black via-black/30 to-transparent 
          transition-opacity duration-300
          ${canScrollRight ? 'opacity-0 group-hover/carousel:opacity-100' : 'opacity-0'}
        `} />

        {/* NÚT MŨI TÊN PHẢI */}
        <button
          onClick={() => scroll('right')}
          className={`
            absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-20 
            w-9 h-9 md:w-11 md:h-11 rounded-lg 
            bg-black/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/10 
            flex items-center justify-center text-white 
            hover:bg-[#C3B665] hover:text-black hover:border-[#C3B665] active:scale-95 
            transition-all duration-300 cursor-pointer
            
            ${canScrollRight
              ? 'opacity-0 translate-x-2 group-hover/carousel:opacity-100 group-hover/carousel:translate-x-0'
              : 'opacity-0 pointer-events-none'
            }
          `}
          aria-label="Next"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>

      </div>
    </div>
  )
}

export default ShowCarousel