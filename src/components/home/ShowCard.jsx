// src/components/home/EventCard.jsx
import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs' // ⭐ Import dayjs (đã có sẵn trong project)

const ShowCard= ({ 
  id, 
  title, 
  price, 
  location,       
  thumbnail,
  start_date      
}) => {
  
  const Wrapper = id ? Link : 'article'
  const wrapperProps = id 
    ? { to: `/shows/${id}`, className: "group flex flex-col gap-3 h-full cursor-pointer" } 
    : { className: "group flex flex-col gap-3 h-full" }

  // ⭐ XỬ LÝ FORMAT NGÀY THÁNG BẰNG DAYJS
  // Format 'MMM D, h:mm A' sẽ cho ra kết quả: Jun 21, 8:00 AM
  const formattedDate = start_date 
    ? dayjs(start_date).format('MMM D, h:mm A') 
    : null

  return (
    <Wrapper {...wrapperProps}>
      
      {/* === KHU VỰC ẢNH === */}
      <div className="relative w-full aspect-video bg-gray-200 mt-2 rounded-xl overflow-hidden transition-transform duration-300 group-hover:[#C3B665]/50 cursor-pointer">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gray-200" /> 
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* === KHU VỰC NỘI DUNG === */}
      <div className="px-1 space-y-1.5 flex flex-col flex-1">
        
        <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-[#C3B665] transition-colors duration-200">
          {title}
        </h3>
        
        <p className="text-gray-400 text-sm">From {price}</p>
        
        {/* Khoảng trống tự động đẩy phần ngày tháng xuống dưới cùng */}
        <div className="mt-auto pt-2"></div>

        {/* === HIỂN THỊ NGÀY THÁNG (Thay thế cho nút bấm) === */}
        {formattedDate ? (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
            <CalendarDays size={14} className="flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
        ) : (
          // Fallback nếu BE không gửi start_date về
          <div className="flex items-center gap-1.5 text-gray-400 text-xs italic">
            <CalendarDays size={14} className="flex-shrink-0" />
            <span>Chưa có lịch</span>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

export default ShowCard