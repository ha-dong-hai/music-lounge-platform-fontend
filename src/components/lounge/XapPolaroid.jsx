// src/components/lounge/XapPolaroid.jsx
//
// XẤP ẢNH POLAROID — khung xem của bộ ảnh không gian phòng trà (BoAnh), in như một xấp ảnh chụp lấy liền đặt trên mặt
// bàn sơn then: tấm trên cùng thấy rõ, hai tấm sau lộ mép, mỗi tấm nghiêng một góc riêng.
// 02/10/2026, chủ dự án chọn "Xấp Polaroid kéo – lật" + font Patrick Hand (reports/Polaroid và kỹ thuật số.md).
//
// TƯƠNG TÁC (mọi thao tác chuột/chạm đều có nút tương đương trong thanh điều khiển của BoAnh):
//  - Kéo tấm trên cùng sang trái/phải quá NGUONG_KEO px (hoặc vuốt nhanh) → tấm đó rời xấp, tấm sau lên trên.
//    Kéo không đủ thì tấm bật về chỗ cũ. Chiều kéo chỉ ngang + `touch-pan-y` để vẫn cuộn dọc trang trên điện thoại.
//  - Chạm/bấm vào tấm (không kéo) → lật xem MẶT SAU: chú thích viết tay đầy đủ. Chỉ lật được khi ảnh CÓ chú thích —
//    lật ra mặt sau trống là hứa một thứ không có.
//  - Mặt trước: dải giấy dưới ảnh in chú thích một dòng bằng chữ viết tay (như người ta ghi lên mép ảnh thật).
//
// TRỢ NĂNG:
//  - WCAG 2.2 SC 2.3.3: chuyển động do tương tác gây ra phải tắt được → prefers-reduced-motion: không bay, không xoay
//    lật (lật = đổi mặt tức thì). Kéo vẫn theo tay (thao tác trực tiếp, người dùng tự gây ra và tự dừng).
//  - Không tự chuyển ảnh (giữ quyết định của BoAnh: WCAG 2.2.2 không kích hoạt).
//  - Mặt sau aria-hidden: nội dung trùng chữ thay thế của ảnh (moTa) — đọc hai lần là thừa.
//
// GÓC NGHIÊNG cố định theo VỊ TRÍ ẢNH (XOAY[k % 4]), không ngẫu nhiên: ngẫu nhiên mỗi lần dựng thì tải lại trang ảnh
// đổi góc, trông như lỗi.
import { useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const XOAY = [-2.5, 3, -4, 1.8] // độ
const NGUONG_KEO = 110 // px
const NGUONG_TOC_DO = 600 // px/s — vuốt nhanh ngắn cũng tính
const SO_TAM_LO = 2 // số tấm lộ mép phía sau tấm trên cùng

const TamAnh = ({ a, ten, k, n, moTa, uuTien }) => (
  <>
    {/* Mặt trước */}
    <div className="absolute inset-0 bg-card p-[4%] pb-0 flex flex-col shadow-lift [backface-visibility:hidden]">
      <div className="aspect-[4/3] w-full overflow-hidden bg-board-soft">
        <img src={a.url} alt={moTa(k)} width="1200" height="900" draggable={false}
          fetchPriority={uuTien ? 'high' : 'auto'} loading={uuTien ? 'eager' : 'lazy'}
          className="w-full h-full object-cover pointer-events-none" />
      </div>
      <p className="flex-1 flex items-center justify-center px-2 font-hand text-xl sm:text-2xl leading-tight text-ink truncate" aria-hidden="true">
        {a.caption ? <span className="truncate">{a.caption}</span> : null}
      </p>
    </div>
    {/* Mặt sau — chỉ dựng khi có chú thích */}
    {a.caption && (
      <div aria-hidden="true"
        className="absolute inset-0 bg-stock p-[8%] flex flex-col justify-between shadow-lift [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <p className="font-hand text-2xl sm:text-3xl leading-snug text-ink">{a.caption}</p>
        <p className="flex items-end justify-between gap-4 font-hand text-lg text-ink-soft">
          <span className="min-w-0 truncate">{ten}</span>
          <span className="font-mono text-xs whitespace-nowrap">{k + 1} / {n}</span>
        </p>
      </div>
    )}
  </>
)

const XapPolaroid = ({ anh, i, ten, moTa, onToi, onLui, lat, onLat }) => {
  const giam = useReducedMotion()
  // Framer vẫn gọi onTap khi THẢ TAY sau một lần kéo (đo 03/10 trên Feelings: kéo sang ảnh 2 thì ảnh 2 hiện luôn mặt sau,
  // vì onDragEnd chuyển ảnh + đặt lại lat, rồi onTap bật lat). Kéo rồi thì cú thả đó không phải bấm.
  const vuaKeo = useRef(false)
  const [huong, setHuong] = useState(1) // 1: tấm cũ bay sang trái (đi tới) · -1: bay sang phải (quay lui)
  const n = anh.length
  const hien = [...new Set(Array.from({ length: Math.min(n, SO_TAM_LO + 1) }, (_, d) => (i + d) % n))]

  const toi = () => { setHuong(1); onToi() }
  const lui = () => { setHuong(-1); onLui() }

  const bienThe = {
    vao: (h) => (giam ? { opacity: 1 } : { opacity: 0, x: h < 0 ? -260 : 0, y: h < 0 ? 0 : 14, scale: 0.94 }),
    ra: (h) => (giam ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: h > 0 ? -420 : 420, rotate: h > 0 ? -14 : 14, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }),
  }

  return (
    <div className="relative aspect-[4/3] w-full grid place-items-center overflow-hidden touch-pan-y select-none [perspective:1600px]">
      <AnimatePresence initial={false} custom={huong}>
        {hien.slice().reverse().map((k) => {
          const d = (k - i + n) % n // 0 = trên cùng
          const tren = d === 0
          return (
            <motion.div
              key={k}
              custom={huong}
              variants={bienThe}
              initial="vao"
              exit="ra"
              animate={{ opacity: 1, x: 0, y: d * 10, scale: 1 - d * 0.035, rotate: XOAY[k % XOAY.length] + (tren ? 0 : d * 1.5) }}
              transition={giam ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }}
              style={{ zIndex: 10 - d }}
              className="col-start-1 row-start-1 relative w-[68%] aspect-[4/3.75]"
              drag={tren && n > 1 ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.7}
              onDragStart={() => { vuaKeo.current = true }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > NGUONG_KEO || Math.abs(info.velocity.x) > NGUONG_TOC_DO) (info.offset.x < 0 ? toi : lui)()
              }}
              onTapStart={() => { vuaKeo.current = false }}
              onTap={() => { if (!vuaKeo.current && tren && anh[k].caption) onLat() }}
              whileDrag={giam ? undefined : { scale: 1.03, cursor: 'grabbing' }}
            >
              <motion.div
                className={`absolute inset-0 [transform-style:preserve-3d] ${tren && n > 1 ? 'cursor-grab' : ''}`}
                animate={giam ? {} : { rotateY: tren && lat ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={giam && tren && lat ? { transform: 'rotateY(180deg)' } : undefined}
              >
                <TamAnh a={anh[k]} ten={ten} k={k} n={n} moTa={moTa} uuTien={k === 0} />
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default XapPolaroid
