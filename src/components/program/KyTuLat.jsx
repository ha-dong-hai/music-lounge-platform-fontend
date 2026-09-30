// src/components/program/KyTuLat.jsx
//
// Ô CHỮ LẬT (split-flap) — mặt chữ của bảng giờ diễn. Mỗi ký tự là một thẻ có vạch ngang giữa, như bảng khởi hành.
// CHUYỂN ĐỘNG: lật MỘT LẦN khi bảng vào khung nhìn (một khoảnh khắc được dàn dựng, không lặp, không lật theo giờ
// thật) — khán giả thấy bảng "vừa cập nhật". Tôn trọng prefers-reduced-motion: hiện thẳng ký tự cuối, không lật.
// Chữ đọc được cho trình đọc màn hình qua `aria-label` trên cả cụm; từng ô lật là trang trí nên aria-hidden.
import { motion, useReducedMotion } from 'framer-motion'

const KyTuLat = ({ chu, tone = 'lamp', lat = true, treMs = 0, className = '' }) => {
  const giamChuyenDong = useReducedMotion()
  const mau =
    tone === 'ember'
      ? 'bg-ember text-board'
      : tone === 'ink'
        ? 'bg-ink text-cream'
        : 'bg-board text-lamp'
  return (
    <span className={`inline-flex gap-[3px] ${className}`} aria-label={chu} role="text">
      {Array.from(chu).map((kt, i) => (
        <span
          key={`${i}-${kt}`}
          aria-hidden="true"
          className={`relative inline-flex items-center justify-center min-w-[1.05em] h-[1.5em] px-[0.12em] font-mono font-semibold leading-none ${kt === ' ' ? 'bg-transparent' : mau}`}
          style={{ perspective: 300 }}
        >
          {kt !== ' ' && kt !== ':' && (
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-board/70" />
          )}
          <motion.span
            className="relative"
            initial={lat && !giamChuyenDong ? { rotateX: -90, opacity: 0 } : false}
            whileInView={{ rotateX: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: (treMs + i * 45) / 1000, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'inline-block', transformOrigin: '50% 50%' }}
          >
            {kt === ' ' ? ' ' : kt}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

export default KyTuLat
