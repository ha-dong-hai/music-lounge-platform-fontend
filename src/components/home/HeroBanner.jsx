// src/components/home/HeroBanner.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import { toggleWishlist } from '../../services/interactionServices'
import toast from 'react-hot-toast'

const HeroBanner = ({ events = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [wishlistStates, setWishlistStates] = useState({})

  // Tự động chuyển slide mỗi 10 giây. 
  // Thêm currentIndex vào dependencies để mỗi lần bấm nút manual, bộ đếm 10s sẽ reset lại.
  useEffect(() => {
    if (events.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [events.length, currentIndex])

  if (events.length === 0) return null

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length)
  }

  const handleToggleWishlist = async (e, id, isWishlisted) => {
    e.preventDefault()
    e.stopPropagation()
    
    setWishlistStates(prev => ({ ...prev, [id]: !isWishlisted }))
    try {
      await toggleWishlist(id, isWishlisted)
      toast.success(isWishlisted ? 'Đã xóa khỏi Wishlist!' : 'Đã thêm vào Wishlist!')
    } catch (err) {
      setWishlistStates(prev => ({ ...prev, [id]: isWishlisted }))
      toast.error('Thao tác thất bại.')
    }
  }

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8 sm:mb-12 group">
      {events.map((event, index) => {
        const isWishlisted = wishlistStates[event.id] !== undefined ? wishlistStates[event.id] : event.isWishlisted
        return (
          <div
            key={event.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <img 
              src={event.coverImageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop"} 
              alt={event.name} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

            {/* z-30 để nằm trên lớp mũi tên gradient */}
            <div className="relative z-30 h-full flex flex-col justify-end p-6 md:p-12 max-w-3xl">
              <div className="flex items-center gap-2 text-[#C3B665] mb-3">
                <CalendarDays size={18} />
                <span className="text-sm font-medium">{dayjs(event.scheduledStart).format('HH:mm - dddd, DD/MM/YYYY')}</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md mb-2">{event.loungeName}</h2>
              <p className="text-lg md:text-2xl text-gray-200 mb-6">{event.name}</p>

              <div className="flex items-center gap-3">
                <Link 
                  to={`/shows/${event.id}`} 
                  className="bg-[#C3B665] text-black hover:bg-[#d4c87f] px-8 py-3 rounded-lg font-bold transition-colors shadow-xl"
                >
                  Get Ticket
                </Link>
                
                <button 
                  onClick={(e) => handleToggleWishlist(e, event.id, isWishlisted)}
                  className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 transition-colors backdrop-blur-sm ${isWishlisted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-black/40 border-white/30 text-white hover:bg-black/70'}`}
                >
                  <Heart size={20} className={isWishlisted ? 'fill-red-500' : ''} />
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {/* ARROW TRÁI - Gradient từ đen tới trong suốt */}
      <div className="absolute left-0 top-0 bottom-0 z-40 flex items-center bg-gradient-to-r from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <button onClick={goToPrev} className="pointer-events-auto p-4 ml-2">
          <ChevronLeft size={40} className="text-white hover:text-[#C3B665] transition-colors" />
        </button>
      </div>

      {/* ARROW PHẢI - Gradient từ đen tới trong suốt */}
      <div className="absolute right-0 top-0 bottom-0 z-40 flex items-center justify-end bg-gradient-to-l from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <button onClick={goToNext} className="pointer-events-auto p-4 mr-2">
          <ChevronRight size={40} className="text-white hover:text-[#C3B665] transition-colors" />
        </button>
      </div>

      {/* Dots chỉ số slide - z-30 để nằm trên mũi tên */}
      {events.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${index === currentIndex ? 'w-8 bg-[#C3B665]' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HeroBanner