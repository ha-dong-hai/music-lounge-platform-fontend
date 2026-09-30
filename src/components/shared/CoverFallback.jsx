// src/components/shared/CoverFallback.jsx
//
// Ô ẢNH KHI CHƯA CÓ ẢNH THẬT — in trong thế giới "tờ chương trình": khối mực tím than, khuông nhạc màu ánh đèn.
// Bản trước dùng gradient kem sáng; đặt trên bảng giờ diễn (nền mực) nó thành một vệt trắng lạc tông.
// Dùng chung cho buổi diễn VÀ phòng trà nên nhãn chỉ nói điều đúng cho cả hai: chưa có ảnh.
import { useId } from 'react'
import { Music2 } from 'lucide-react'

const CoverFallback = ({ className = '' }) => {
  const id = useId().replace(/:/g, '')
  return (
    <div
      className={`relative flex items-center justify-center w-full h-full overflow-hidden bg-board ${className}`}
      role="img"
      aria-label="Chưa có ảnh"
    >
      {/* Khuông nhạc 5 dòng — hoạ tiết của tờ chương trình, không phải icon lặp vô nghĩa */}
      <svg className="absolute inset-0 w-full h-full opacity-25" aria-hidden="true">
        <pattern id={`khuong-${id}`} width="100%" height="56" patternUnits="userSpaceOnUse">
          {[8, 16, 24, 32, 40].map((y) => (
            <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="var(--color-lamp)" strokeWidth="1" />
          ))}
        </pattern>
        <rect width="100%" height="100%" fill={`url(#khuong-${id})`} />
      </svg>
      <Music2 size={36} strokeWidth={1.5} className="relative text-lamp/70" aria-hidden="true" />
    </div>
  )
}

export default CoverFallback
