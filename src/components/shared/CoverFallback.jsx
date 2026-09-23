// src/components/shared/CoverFallback.jsx

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