// src/components/shared/MuiTenLuyen.jsx
//
// MŨI TÊN DẤU LUYẾN — mũi tên là một nét cong thuôn như dấu luyến (slur) nối các nốt trên khuông nhạc, đầu mũi tên
// nét bút tròn. Thay ô vuông viền 2px + mũi tên nét thẳng (lucide) của bản 02/10 sáng: chủ dự án chê "cứng nhắc, không
// mềm mại", chọn phương án D trong bốn bản dựng thử cùng font/màu (scratchpad muiten.html, 02/10/2026).
//
// `huong`: 'toi' (đi tiếp) · 'lui' (quay lại — cùng nét, lật ngang) · 'ngoai' (mở trang ngoài — nét cong vút lên).
// Rê chuột: nhóm cha đặt `group/lk` hoặc `group/cuong` → mũi tên trượt tới 3px theo đường cong ease-out 0,3s; người đã
// tắt chuyển động (prefers-reduced-motion) thì đứng yên. Luôn aria-hidden: chữ bên cạnh đã nói hành động.
const TRUOT = 'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.22,1,.36,1)]'

const MuiTenLuyen = ({ huong = 'toi', rong = 40, className = '' }) => {
  if (huong === 'ngoai') {
    const cao = Math.round(rong * 20 / 26)
    return (
      <svg aria-hidden="true" width={rong} height={cao} viewBox="0 0 26 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        className={`flex-shrink-0 ${TRUOT} motion-safe:group-hover/lk:translate-x-[2px] motion-safe:group-hover/lk:-translate-y-[2px] ${className}`}>
        <path d="M2 18C6 9 13 4 22 3" /><path d="M16.5 1.2 22.5 3 19 8" />
      </svg>
    )
  }
  const cao = Math.round(rong * 18 / 40)
  const lat = huong === 'lui'
  return (
    <svg aria-hidden="true" width={rong} height={cao} viewBox="0 0 40 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      className={`flex-shrink-0 ${lat ? '-scale-x-100' : ''} ${TRUOT} ${lat
        ? 'motion-safe:group-hover/lk:-translate-x-[3px]'
        : 'motion-safe:group-hover/lk:translate-x-[3px] motion-safe:group-hover/cuong:translate-x-[3px] motion-safe:group-hover/dong:translate-x-[3px]'} ${className}`}>
      <path d="M1.5 12C10 3 24 3 36 9.5" /><path d="M30.5 4.8 36.6 9.8 29.8 12.4" />
    </svg>
  )
}

export default MuiTenLuyen
