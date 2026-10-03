// src/components/shared/TrinhXemAnh.jsx
//
// TRÌNH XEM ẢNH LỚN dùng chung (03/10/2026) — một ảnh mỗi lượt, KHÔNG cắt ảnh; sang ảnh khác bằng BA cách ngang nhau:
// kéo chuột / vuốt, phím mũi tên, hoặc nút. Chủ dự án: "bổ sung cơ chế kéo ảnh qua lại bằng phím hoặc kéo thả chuột với
// review, ảnh phòng trà... và các ảnh khác". Trước đó lớp "Xem tất cả ảnh" của phòng trà chỉ là một lưới: bấm ảnh thì
// đóng, không xem lần lượt được bằng phím hay kéo.
//
// - HÀNH VI kéo/vuốt/bắt điểm lấy từ Embla Carousel (thư viện nền của Carousel trong shadcn/ui) — không tự viết.
// - PHÍM: ← → sang ảnh; Home / End về ảnh đầu / cuối. Nghe ở mức tài liệu trong lúc trình xem đang mở (nó luôn nằm trong
//   một <dialog> modal nên không tranh phím với phần còn lại của trang); bỏ qua khi đang gõ trong ô nhập.
// - WAI-ARIA APG (carousel): vùng "carousel", mỗi ảnh là group "slide" có nhãn "Ảnh 3 trên 12"; nút Trước/Sau thật; không
//   tự chạy. Ảnh đang khuất gắn `inert`.
// - NHIỀU ẢNH THÌ SAO: chỉ dựng thẻ <img> cho ảnh đang xem và hai ảnh kề; các lượt khác là ô trống cùng cỡ — bộ 30 ảnh
//   không tải 30 ảnh lớn một lúc. Bộ đếm "03 / 30" luôn hiện.
// - prefers-reduced-motion: đổi ảnh tức thì (không trượt).
import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const NUT = 'inline-flex items-center justify-center w-12 h-12 border border-lamp/40 text-lamp transition-colors hover:bg-lamp hover:text-board disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-lamp disabled:cursor-not-allowed'

const TrinhXemAnh = ({ anh, batDau = 0, moTa, onDoi, nhan = 'Xem ảnh' }) => {
  const itChuyenDong = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [khung, embla] = useEmblaCarousel({ loop: false, startIndex: batDau, duration: itChuyenDong ? 0 : 22 })
  const [chon, setChon] = useState(batDau)
  const n = anh.length

  useEffect(() => {
    if (!embla) return undefined
    const doi = () => { const k = embla.selectedScrollSnap(); setChon(k); onDoi?.(k) }
    embla.on('select', doi)
    return () => { embla.off('select', doi) }
  }, [embla, onDoi])

  const truoc = useCallback(() => embla?.scrollPrev(), [embla])
  const sau = useCallback(() => embla?.scrollNext(), [embla])

  useEffect(() => {
    if (!embla) return undefined
    const phim = (e) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); embla.scrollPrev() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); embla.scrollNext() }
      else if (e.key === 'Home') { e.preventDefault(); embla.scrollTo(0) }
      else if (e.key === 'End') { e.preventDefault(); embla.scrollTo(n - 1) }
    }
    document.addEventListener('keydown', phim)
    return () => document.removeEventListener('keydown', phim)
  }, [embla, n])

  return (
    <div role="region" aria-roledescription="carousel" aria-label={nhan} className="flex flex-col min-h-0 flex-1">
      <div ref={khung} className="overflow-hidden flex-1 min-h-0 cursor-grab active:cursor-grabbing">
        <div className="flex h-full touch-pan-y" aria-live="polite">
          {anh.map((a, k) => (
            <div key={a.url + k} role="group" aria-roledescription="slide" aria-label={`Ảnh ${k + 1} trên ${n}`} inert={k !== chon}
              className="relative min-w-0 shrink-0 grow-0 basis-full h-full flex items-center justify-center px-3 sm:px-8 py-3 select-none">
              {/* Chữ nằm DƯỚI ảnh: nhảy thẳng tới một ảnh xa (phím End, bấm ảnh trong lưới) thì ảnh chưa kịp tải — bản đầu để
                  khung trống đen, không biết là đang tải hay hỏng (đo 03/10). Ảnh tải xong thì che chữ đi. */}
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-mono text-sm text-lamp-mute">Đang tải ảnh…</span>
              {Math.abs(k - chon) <= 1 && (
                <img src={a.url} alt={moTa(k)} draggable={false} className="relative max-w-full max-h-full object-contain pointer-events-none bg-board" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-8 py-3 border-t border-lamp/20">
        <div className="flex gap-2">
          <button type="button" onClick={truoc} disabled={chon === 0} aria-label="Ảnh trước" className={NUT}><ArrowLeft size={20} aria-hidden="true" /></button>
          <button type="button" onClick={sau} disabled={chon === n - 1} aria-label="Ảnh sau" className={NUT}><ArrowRight size={20} aria-hidden="true" /></button>
        </div>
        <p className="font-mono text-sm text-lamp" aria-hidden="true">{String(chon + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</p>
        {anh[chon]?.caption && <p className="font-hand text-xl text-lamp min-w-0 [overflow-wrap:anywhere]">{anh[chon].caption}</p>}
        <p className="ml-auto text-sm text-lamp-mute hidden sm:block">Kéo ảnh, hoặc dùng phím ← →</p>
      </div>
    </div>
  )
}

export default TrinhXemAnh
