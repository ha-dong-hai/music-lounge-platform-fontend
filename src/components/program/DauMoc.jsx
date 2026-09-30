// src/components/program/DauMoc.jsx
//
// DẤU MỘC — vật thể của thế giới "tờ chương trình": con dấu cao su đỏ đóng lên giấy.
// LUẬT DÙNG (hợp đồng hướng thiết kế): dấu mộc CHỈ nói về TIỀN — tiền vé giữ hộ, đã hoàn, đã quyết toán. Không dùng
// làm trang trí cho câu khác; dấu đóng khắp nơi thì mất nghĩa.
// SVG tự vẽ (chữ chạy theo vòng tròn bằng <textPath>) — không phải ảnh, nên chữ vẫn là chữ thật cho trình đọc màn
// hình và sắc nét ở mọi cỡ.
import { useId } from 'react'

const DauMoc = ({ vongNgoai, giua, size = 132, xoay = -12, className = '' }) => {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`${giua}. ${vongNgoai}`}
      className={`text-stamp select-none ${className}`}
      style={{ transform: `rotate(${xoay}deg)` }}
    >
      <defs>
        <path id={`vong-${id}`} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="36" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <text fill="currentColor" fontFamily="var(--font-sans)" fontWeight="700" fontSize="9.5" letterSpacing="1.2">
        <textPath href={`#vong-${id}`} startOffset="0">{vongNgoai}</textPath>
      </text>
      <text x="60" y="57" textAnchor="middle" fill="currentColor" fontFamily="var(--font-display)" fontSize="15">
        {giua.split('\n')[0]}
      </text>
      {giua.split('\n')[1] && (
        <text x="60" y="73" textAnchor="middle" fill="currentColor" fontFamily="var(--font-display)" fontSize="15">
          {giua.split('\n')[1]}
        </text>
      )}
    </svg>
  )
}

export default DauMoc
