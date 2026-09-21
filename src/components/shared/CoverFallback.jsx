// src/components/shared/CoverFallback.jsx
//
// GHI CHÚ CHO ĐỘI FE — vì sao file này tồn tại:
// Trước đây khi một buổi diễn/phòng trà chưa có ảnh bìa, cả ba nơi (ShowCard, HeroBanner,
// LoungeDetailPage) đều rơi về CÙNG MỘT ảnh Unsplash chụp tán rừng nhìn lên trời — không liên quan
// gì tới phòng trà, không mang giọng thương hiệu, và lặp lại giống hệt nhau ở khắp nơi trên trang.
// Đây đúng là kiểu "ảnh stock ngẫu nhiên" khiến giao diện trông như mẫu dựng sẵn, không phải sản
// phẩm được chăm chút — thứ người dùng gọi là AI slop. Ô trống này giờ là một hoạ tiết THUỘC VỀ
// thương hiệu (gradient ấm + đường kẻ khuông nhạc mờ + icon guitar), không mượn ảnh chụp bất kỳ.
// Không cần tải ảnh nào — nhẹ hơn, và không bao giờ "lỗi ảnh" vì không có request nào để hỏng.
import { Guitar } from 'lucide-react'

const CoverFallback = ({ className = '' }) => (
  <div
    className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-sunken via-card to-line/40 ${className}`}
    role="img"
    aria-label="Chưa có ảnh cho buổi diễn này"
  >
    {/* Khuông nhạc mờ — hoạ tiết lặp lại nhẹ nhàng, không phải icon lặp vô nghĩa */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" aria-hidden="true">
      <pattern id="cover-fallback-lines" width="100%" height="14" patternUnits="userSpaceOnUse">
        <line x1="0" y1="7" x2="100%" y2="7" stroke="currentColor" strokeWidth="1" className="text-ink" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#cover-fallback-lines)" />
    </svg>
    <Guitar size={40} strokeWidth={1.25} className="relative text-ink-mute/60" aria-hidden="true" />
  </div>
)

export default CoverFallback
