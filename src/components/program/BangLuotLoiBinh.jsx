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
// ẢNH CỦA MỖI LƯỢT (bản 2, 03/10/2026) — MỘT ảnh, theo thứ tự ưu tiên, chú thích GHI RÕ NGUỒN để không ai tưởng ảnh phòng
// trà là ảnh khán giả chụp:
//    1. ảnh khán giả đính kèm đánh giá  → "Ảnh của [tên]"
//    2. ảnh bìa đêm diễn                → "Ảnh bìa đêm diễn"
//    3. ảnh đại diện phòng trà          → tên phòng trà
//  Ảnh hỏng (404) thì lùi xuống nguồn kế. Bản 1 chỉ nhận ảnh khán giả, còn lại in kiểu chỉ-có-chữ: với dữ liệu thật (một
//  lời ngắn "Rat hay!", không ảnh, đêm diễn không có ảnh bìa) khối đen cao 640px gần như rỗng — chủ dự án: "trống trải quá".
//  Thiết kế cho "nhiều và dài" mà bỏ sót "ít và ngắn".
// KHÔNG CÒN ẢNH NÀO (cả ba nguồn đều thiếu/hỏng): lượt chỉ có chữ và THU GỌN theo nội dung — không giữ chiều cao tối thiểu.
// LỜI NGẮN (dưới 80 ký tự) in chữ to hơn: một câu ngắn ở cỡ chữ thường trông lạc lõng cạnh tấm ảnh.
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
  const ten = r.userName || 'Khán giả'
  // Các nguồn ảnh theo thứ tự ưu tiên; `soHong` = số nguồn đầu đã hỏng (onError) → dùng nguồn kế.
  const nguon = [
    r.imageUrl && { url: r.imageUrl, chuThich: `Ảnh của ${ten}`, alt: `Ảnh ${ten} chụp trong đêm ${r.buoi.name}` },
    r.buoi.coverImageUrl && { url: r.buoi.coverImageUrl, chuThich: 'Ảnh bìa đêm diễn', alt: `Ảnh bìa đêm ${r.buoi.name}` },
    r.buoi.phongTra.anh && { url: r.buoi.phongTra.anh, chuThich: r.buoi.phongTra.name, alt: `Ảnh ${r.buoi.phongTra.name}` },
  ].filter(Boolean)
  const [soHong, setSoHong] = useState(0)
  const [biCat, setBiCat] = useState(false)
  const loi = useRef(null)
  const anh = nguon[soHong] ?? null
  const ngan = r.comment.length < 80

  useLayoutEffect(() => {
    const el = loi.current
    // Lời ngắn không kẹp dòng nên không bao giờ "bị cắt" — không đo (chữ to có nét vượt khung dòng làm phép đo báo nhầm:
    // đo 03/10, "Rat hay!" hiện liên kết "Đọc trọn lời này…").
    if (!el || ngan) return undefined
    const do_ = () => setBiCat(el.scrollHeight > el.clientHeight + 1)
    do_()
    const ro = new ResizeObserver(do_)
    ro.observe(el)
    return () => ro.disconnect()
  }, [r.comment, anh, ngan])

  return (
    <div className={`w-full grid gap-8 lg:gap-12 items-center ${anh ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : ''}`}>
      {anh && (
        <figure className="m-0 mx-auto w-[min(100%,14rem)] lg:w-[min(100%,19rem)] bg-card text-ink p-3 pb-4 -rotate-2 shadow-[0_10px_22px_rgb(0_0_0/0.4)]">
          <div className="aspect-square lg:aspect-[4/5] overflow-hidden bg-sunken">
            <img key={anh.url} src={anh.url} alt={anh.alt} loading="lazy" width="400" height="500"
              onError={() => setSoHong((n) => n + 1)} className="w-full h-full object-cover" />
          </div>
          <figcaption className="font-hand text-lg leading-tight mt-2.5 [overflow-wrap:anywhere]">{anh.chuThich}</figcaption>
        </figure>
      )}

      <div className={anh ? '' : 'max-w-[52rem] w-full'}>
        <Sao diem={r.score} />
        <blockquote ref={loi} className={`font-hand mt-3 ${CHU_NGUOI_VIET} ${ngan ? 'text-4xl sm:text-5xl leading-[1.15]' : anh ? 'text-2xl leading-snug line-clamp-6' : 'text-[1.75rem] sm:text-4xl leading-[1.25] line-clamp-5'}`}>
          “{r.comment}”
        </blockquote>
        {biCat && !ngan && (
          <Link to={`/shows/${r.buoi.id}`} className="inline-flex items-center min-h-[44px] mt-1 text-sm font-semibold text-lamp underline underline-offset-4">
            Đọc trọn lời này ở trang buổi diễn
          </Link>
        )}
        <p className="text-sm text-lamp-mute mt-5 [overflow-wrap:anywhere]">
          — <span className="text-lamp font-semibold">{ten}</span> · <Link to={`/shows/${r.buoi.id}`} className="underline underline-offset-2 hover:text-lamp">{r.buoi.name}</Link>
          <br />{r.buoi.phongTra.name} · {ngayDayDu(r.buoi.scheduledStart)}
        </p>
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
    // tabIndex 0 khi có hơn một lượt: Tab tới được CẢ BĂNG rồi dùng ← → (bản trước phím chỉ ăn khi đang đứng ở một nút bên
    // trong). Khung viền chỉ hiện khi đi bằng bàn phím.
    <div role="region" aria-roledescription="carousel" onKeyDown={n > 1 ? phim : undefined} tabIndex={n > 1 ? 0 : undefined}
      aria-label={n > 1 ? 'Lời khán giả sau những đêm đã diễn. Dùng phím mũi tên trái phải để sang lời khác.' : 'Lời khán giả sau những đêm đã diễn'}
      className="bg-board text-lamp p-5 sm:p-8 lg:p-12 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
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
          <p className="hidden sm:block text-sm text-lamp-mute ml-auto">Kéo, hoặc dùng phím ← →</p>
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
