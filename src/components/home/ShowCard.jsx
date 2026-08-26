// src/components/home/EventCard.jsx
import { CalendarDays, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { useState } from 'react'
import { toggleWishlist } from '../../services/interactionServices'
import toast from 'react-hot-toast'

const ShowCard = ({ 
  id, 
  title, 
  price, 
  location,       
  thumbnail,
  start_date,
  format,          
  isWishlisted = false 
}) => {
  const [wished, setWished] = useState(isWishlisted)

  const Wrapper = id ? Link : 'article'
  const wrapperProps = id 
    ? { to: `/shows/${id}`, className: "group flex flex-col gap-3 h-full cursor-pointer" } 
    : { className: "group flex flex-col gap-3 h-full" }

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
    } catch (err) {
      setWished(prev)
      toast.error('Thao tác thất bại.')
    }
  }

  return (
    <Wrapper {...wrapperProps}>
      
      {/* === KHU VỰC ẢNH === */}
      <div className="relative w-full aspect-video bg-gray-200 mt-2 rounded-xl overflow-hidden transition-transform duration-300 group-hover:[#C3B665]/50 cursor-pointer">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gray-200" /> 
        )}
        
        {/* TAG FORMAT GÓC TRÊN BÊN TRÁI */}
        {format && (
          <span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold ${formatClass} backdrop-blur-sm`}>
            {format}
          </span>
        )}

        {/* NÚT WISHLIST GÓC TRÊN BÊN PHẢI */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm transition-colors ${wished ? 'text-red-500' : 'text-white hover:text-red-400'}`}
        >
          <Heart size={16} className={wished ? 'fill-red-500' : ''} />
        </button>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* === KHU VỰC NỘI DUNG === */}
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
    </Wrapper>
  )
}

export default ShowCard