// src/components/program/BangLuotLoiBinh.jsx
//
// BĂNG LƯỚT LỜI BÌNH (khối "Đêm đã qua", 03/10/2026) — mỗi lượt là MỘT lời của khán giả sau một đêm đã diễn; lướt
// qua lại bằng nút, phím mũi tên, hoặc vuốt. Chủ dự án: "mỗi review 1 ảnh, có thể lướt qua lại; có thể có ảnh hoặc không".
//
// CĂN CỨ (reports/Đêm đã qua - băng lướt review.md ở repo backend):
//  - HÀNH VI lướt/vuốt/bắt điểm lấy từ Embla Carousel (thư viện nền của Carousel trong shadcn/ui) — không tự viết.
//  - NN/g: tối đa 5 lượt; nút điều hướng nằm TRONG băng; luôn in "đang ở lượt mấy trên mấy"; không tự chạy.
//  - WAI-ARIA APG (carousel): vùng có aria-roledescription="carousel", mỗi lượt là group "slide" có nhãn "Lời 2 trên 5",
//    nút Trước/Sau thật. KHÔNG tự chạy → không cần nút dừng. Lượt đang khuất gắn `inert` để Tab không lọt vào liên kết
//    của lượt không nhìn thấy.
//
// HAI TRẠNG THÁI (thiết kế trạng thái KHÔNG ẢNH trước, ảnh là phần cộng thêm):
//  - CÓ ẢNH khán giả gửi: ảnh nằm trong khung Polaroid (vẻ đã có ở XapPolaroid), chú thích viết tay ghi rõ ẢNH CỦA AI —
//    không để người xem tưởng ảnh của phòng trà. Ảnh hỏng (404) thì lượt đó tự lùi về trạng thái không ảnh.
//  - KHÔNG ẢNH: KHÔNG lấp chỗ trống bằng ảnh kho hay ảnh phòng trà giả làm ảnh khán giả. Lời bình thành nhân vật chính:
//    chữ to hơn, dấu ngoặc lớn làm điểm nhấn; ảnh bìa buổi diễn chỉ là hình nhỏ cạnh dòng ghi nguồn (đúng là ảnh buổi đó).
//  Hai trạng thái cùng chiều cao tối thiểu để băng không giật khi lướt.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ngayDayDu } from '../../utils/ngayVietNam'

// Chữ do khán giả gõ: giữ xuống dòng của họ, ngắt được chuỗi dài không dấu cách (đo 03/10: một đường dẫn dài làm cả
// trang chủ cuộn ngang tới 1.814px).
const CHU_NGUOI_VIET = 'whitespace-pre-line [overflow-wrap:anywhere]'
const NUT = 'inline-flex items-center justify-center w-11 h-11 border-2 border-lamp/60 text-lamp transition-colors hover:bg-lamp hover:text-board disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-lamp disabled:cursor-not-allowed'

const Sao = ({ diem }) => (
  <span className="font-mono text-sm tracking-[0.15em] text-lamp">
    <span aria-hidden="true">{'★'.repeat(diem)}{'☆'.repeat(5 - diem)}</span>
    <span className="sr-only">{diem} trên 5 sao</span>
  </span>
)

const LuotLoi = ({ r }) => {
  const [anhHong, setAnhHong] = useState(false)
  const [biCat, setBiCat] = useState(false)
  const loi = useRef(null)
  const coAnh = Boolean(r.imageUrl) && !anhHong
  const ten = r.userName || 'Khán giả'

  useLayoutEffect(() => {
    const el = loi.current
    if (!el) return undefined
    const do_ = () => setBiCat(el.scrollHeight > el.clientHeight + 1)
    do_()
    const ro = new ResizeObserver(do_)
    ro.observe(el)
    return () => ro.disconnect()
  }, [r.comment, coAnh])

  return (
    <div className={`w-full grid gap-8 lg:gap-12 items-center lg:min-h-[24rem] ${coAnh ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : ''}`}>
      {coAnh && (
        <figure className="m-0 mx-auto w-[min(100%,14rem)] lg:w-[min(100%,19rem)] bg-card text-ink p-3 pb-4 -rotate-2 shadow-[0_10px_22px_rgb(0_0_0/0.4)]">
          <div className="aspect-square lg:aspect-[4/5] overflow-hidden bg-sunken">
            <img src={r.imageUrl} alt={`Ảnh ${ten} chụp trong đêm ${r.buoi.name}`} loading="lazy" width="400" height="500"
              onError={() => setAnhHong(true)} className="w-full h-full object-cover" />
          </div>
          <figcaption className="font-hand text-lg leading-tight mt-2.5 [overflow-wrap:anywhere]">Ảnh của {ten}</figcaption>
        </figure>
      )}

      <div className={coAnh ? '' : 'max-w-[52rem] mx-auto w-full'}>
        {/* Dấu ngoặc bằng phông viết tay (cùng phông với lời bình). Bản đầu dùng phông tiêu đề Anton: nét ngoặc ra hai ô vuông. */}
        {!coAnh && <span aria-hidden="true" className="block font-hand text-[7rem] leading-[0.55] h-12 text-lamp/30 select-none">“</span>}
        <Sao diem={r.score} />
        <blockquote ref={loi} className={`font-hand mt-3 ${CHU_NGUOI_VIET} ${coAnh ? 'text-2xl leading-snug line-clamp-6' : 'text-[1.75rem] sm:text-4xl leading-[1.25] line-clamp-5'}`}>
          {coAnh ? `“${r.comment}”` : r.comment}
        </blockquote>
        {biCat && (
          <Link to={`/shows/${r.buoi.id}`} className="inline-flex items-center min-h-[44px] mt-1 text-sm font-semibold text-lamp underline underline-offset-4">
            Đọc trọn lời này ở trang buổi diễn
          </Link>
        )}
        <div className="flex items-center gap-3 mt-5">
          {!coAnh && r.buoi.coverImageUrl && (
            <img src={r.buoi.coverImageUrl} alt="" loading="lazy" width="56" height="56" className="w-14 h-14 object-cover flex-shrink-0 border border-lamp/25" />
          )}
          <p className="text-sm text-lamp-mute min-w-0 [overflow-wrap:anywhere]">
            — <span className="text-lamp font-semibold">{ten}</span> · <Link to={`/shows/${r.buoi.id}`} className="underline underline-offset-2 hover:text-lamp">{r.buoi.name}</Link>
            <br />{r.buoi.phongTra.name} · {ngayDayDu(r.buoi.scheduledStart)}
          </p>
        </div>
      </div>
    </div>
  )
}

const BangLuotLoiBinh = ({ loi }) => {
  const itChuyenDong = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [khung, embla] = useEmblaCarousel({ loop: false, align: 'start', duration: itChuyenDong ? 0 : 25 })
  const [chon, setChon] = useState(0)
  const n = loi.length

  useEffect(() => {
    if (!embla) return undefined
    const doi = () => setChon(embla.selectedScrollSnap())
    embla.on('select', doi).on('reInit', doi)
    return () => { embla.off('select', doi).off('reInit', doi) }
  }, [embla])

  const truoc = useCallback(() => embla?.scrollPrev(), [embla])
  const sau = useCallback(() => embla?.scrollNext(), [embla])
  const phim = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); truoc() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); sau() }
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Lời khán giả sau những đêm đã diễn" onKeyDown={n > 1 ? phim : undefined}
      className="bg-board text-lamp p-5 sm:p-8 lg:p-12">
      <div ref={khung} className="overflow-hidden">
        {/* aria-live polite: băng KHÔNG tự chạy nên đổi lượt là do người dùng bấm — đọc lượt mới cho trình đọc màn hình (APG). */}
        <div className="flex touch-pan-y" aria-live="polite">
          {loi.map((r, i) => (
            <div key={r.id} role="group" aria-roledescription="slide" aria-label={`Lời ${i + 1} trên ${n}`} inert={i !== chon}
              className="min-w-0 shrink-0 grow-0 basis-full px-3 py-4 flex items-center">
              <LuotLoi r={r} />
            </div>
          ))}
        </div>
      </div>

      {n > 1 && (
        <div className="flex items-center justify-between gap-4 mt-8 pt-5 border-t border-lamp/20">
          <p className="font-mono text-sm text-lamp-mute" aria-hidden="true">
            <span className="text-lamp">{String(chon + 1).padStart(2, '0')}</span> / {String(n).padStart(2, '0')}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={truoc} disabled={chon === 0} aria-label="Lời trước" className={NUT}><ArrowLeft size={20} aria-hidden="true" /></button>
            <button type="button" onClick={sau} disabled={chon === n - 1} aria-label="Lời sau" className={NUT}><ArrowRight size={20} aria-hidden="true" /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BangLuotLoiBinh
