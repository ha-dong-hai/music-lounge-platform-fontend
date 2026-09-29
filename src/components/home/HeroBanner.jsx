// src/components/home/HeroBanner.jsx
//
// GHI CHÚ CHO ĐỘI FE — vì sao trang này viết lại (xem docs/design/TRANG-CHU-BRIEF.md):
// - Mọi nhãn hiển thị (thể loại, nghệ sĩ, giá, "tối nay") đều lấy thẳng từ field API thật
//   (genres, performerNames, minPrice, scheduledStart) — KHÔNG bịa số liệu như bản Stitch tham khảo
//   ("Est. 1972", "còn 6 vé"). Thiếu field nào thì ẩn dòng đó, không hiện chữ giả.
// - Ken Burns (zoom chậm 18s) chạy một lần khi ảnh mount, dừng hẳn nếu prefers-reduced-motion.
// - Băng chuyền tự xoay PHẢI dừng được: xem khối "QUYỀN DỪNG BĂNG CHUYỀN" ngay trên useEffect.
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, ArrowRight, Pause, Play } from 'lucide-react'
import dayjs from 'dayjs'
import { toggleWishlist } from '../../services/interactionServices'
import toast from 'react-hot-toast'
import CoverFallback from '../shared/CoverFallback'
import SplitText from '../reactbits/SplitText'
import MotionGuard from '../shared/MotionGuard'
import { useGiamChuyenDong } from '../../hooks/useGiamChuyenDong'

// Một chuỗi lớp DUY NHẤT cho tiêu đề hero, dùng chung cho cả bản có hiệu ứng và bản tĩnh. Tách ra
// hằng số để hai nhánh không bao giờ lệch nhau về cỡ chữ — lệch là bố cục nhảy khi đổi cài đặt.
// Kỹ thuật lấy từ mẫu chữ biên tập đã tra: cỡ lớn, SIẾT tracking, NÉN leading để khối chữ nặng
// như tiêu đề bìa tạp chí; `text-balance` chặn lỗi một chữ lẻ rơi xuống dòng cuối.
const TIEU_DE_HERO =
  'font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[0.95] text-balance text-cream mb-4'

const formatPrice = (v) => v == null ? null : v === 0 ? 'Miễn phí' : `${v.toLocaleString('vi-VN')}đ`

// "Tối nay" / "Ngày mai" / null — chỉ hiện khi thật sự đúng, không đoán mò cho các ngày khác.
const dieuKienChip = (scheduledStart) => {
  const d = dayjs(scheduledStart)
  const today = dayjs()
  if (d.isSame(today, 'day')) return 'Tối nay'
  if (d.isSame(today.add(1, 'day'), 'day')) return 'Ngày mai'
  return null
}

const HeroBanner = ({ events = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [wishlistStates, setWishlistStates] = useState({})
  const [nguoiDungDaDung, setNguoiDungDaDung] = useState(false)
  const [dangTroChuot, setDangTroChuot] = useState(false)
  const [dangGiuFocus, setDangGiuFocus] = useState(false)
  const giamChuyenDong = useGiamChuyenDong()

  // QUYỀN DỪNG BĂNG CHUYỀN — trước đây thiếu hoàn toàn.
  //
  // Bản cũ chỉ có `setInterval` 10 giây, không cách nào dừng: không nút tạm dừng, không dừng khi rê
  // chuột, không dừng khi đang Tab vào trong, và chạy cả khi người dùng đã bật "giảm chuyển động"
  // ở hệ điều hành. Nội dung tự đổi dưới tay người đang đọc là rào cản thật với người đọc chậm,
  // người dùng bàn phím và người dùng trình đọc màn hình — WCAG 2.2.2 (Pause, Stop, Hide).
  //
  // Bốn điều kiện dừng, theo đúng thứ tự ưu tiên:
  //   1. Người dùng bật "giảm chuyển động" → không bao giờ tự chạy.
  //   2. Người dùng bấm nút tạm dừng → tôn trọng tuyệt đối, kể cả khi rời chuột ra.
  //   3. Đang rê chuột lên băng chuyền → họ đang đọc.
  //   4. Đang có focus bàn phím bên trong → họ đang thao tác.
  const dangChay =
    events.length > 1 && !giamChuyenDong && !nguoiDungDaDung && !dangTroChuot && !dangGiuFocus

  // currentIndex nằm trong deps để mỗi lần bấm nút thủ công thì bộ đếm 10 giây khởi động lại từ đầu.
  useEffect(() => {
    if (!dangChay) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [dangChay, events.length, currentIndex])

  if (events.length === 0) return null

  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % events.length)

  const handleToggleWishlist = async (e, id, isWishlisted) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlistStates(prev => ({ ...prev, [id]: !isWishlisted }))
    try {
      await toggleWishlist(id, isWishlisted)
      toast.success(isWishlisted ? 'Đã bỏ khỏi danh sách yêu thích' : 'Đã thêm vào yêu thích')
    } catch {
      setWishlistStates(prev => ({ ...prev, [id]: isWishlisted }))
      toast.error('Thao tác thất bại, thử lại sau.')
    }
  }

  return (
    <div
      className="relative w-full h-[480px] md:h-[600px] rounded-2xl overflow-hidden border border-line shadow-glow group"
      // React cho onFocus/onBlur nổi bọt lên cha, nên bắt được focus của mọi nút bên trong mà không
      // cần onFocusCapture riêng.
      onMouseEnter={() => setDangTroChuot(true)}
      onMouseLeave={() => setDangTroChuot(false)}
      onFocus={() => setDangGiuFocus(true)}
      onBlur={() => setDangGiuFocus(false)}
      role="region"
      aria-roledescription="băng chuyền"
      aria-label="Buổi diễn nổi bật"
    >
      {/* Thông báo vị trí slide cho trình đọc màn hình. `aria-live="polite"` để nó đọc xen vào lúc
          rảnh chứ không cắt ngang. Chỉ có chữ, không chiếm chỗ trên màn hình. */}
      <p className="sr-only" aria-live="polite">
        Buổi diễn {currentIndex + 1} trên {events.length}
        {events[currentIndex]?.name ? `: ${events[currentIndex].name}` : ''}
      </p>
      {events.map((event, index) => {
        const isWishlisted = wishlistStates[event.id] !== undefined ? wishlistStates[event.id] : event.isWishlisted
        const kicker = event.genres?.[0]?.name
        const chip = dieuKienChip(event.scheduledStart)
        const price = formatPrice(event.minPrice)
        const isActive = index === currentIndex
        return (
          <div
            key={event.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!isActive}
            // `inert`: slide đang ẩn không nhận focus bàn phím/đọc màn hình (trước đây Tab vẫn rơi vào các
            // nút "Đặt vé ngay" vô hình của slide khác).
            inert={!isActive}
          >
            <div className="absolute inset-0 overflow-hidden">
              {event.coverImageUrl ? (
                <img
                  src={event.coverImageUrl}
                  alt=""
                  className="w-full h-full object-cover animate-ken-burns"
                />
              ) : (
                <CoverFallback className="w-full h-full animate-ken-burns" />
              )}
            </div>
            {/* Lớp phủ espresso — chỉ đủ đậm để chữ đọc được, không nuốt hết ảnh (tránh đúng lỗi
                "chữ vô hình trên nền tối" thấy trong bản Stitch tham khảo). */}
            <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/55 to-espresso/5 md:bg-gradient-to-r md:from-espresso/95 md:via-espresso/45 md:to-transparent" />

            <div className="relative z-30 h-full flex flex-col justify-end p-6 md:p-14 max-w-2xl">
              {/* Nhãn biên tập, thay cho pill nổi trên H1.
                  Đây là việc THỰC THI quyết định đã ghi ở docs/design/TRANG-CHU-BRIEF.md §6 mà bản
                  trước mới quyết chứ chưa làm: "badge/pill phía trên H1" là 1 trong 16 dấu hiệu AI
                  slop đã tra cứu được, nên đổi sang đúng hình thức nhãn tạp chí in — gạch chỉ mảnh
                  + chữ nhỏ giãn ký tự, canh lệch trái, không viên thuốc bo tròn.
                  Chấm `animate-pulse` bỏ theo: đó là animation lặp vô hạn thuần trang trí, thứ chính
                  §5 của brief xếp mức High phải tránh (useReveal.js:7-8 nhắc lại lần nữa).
                  Nội dung nhãn vẫn là dữ liệu thật: chip chỉ hiện khi đúng hôm nay/ngày mai, kicker
                  là tên thể loại từ API — thiếu cái nào thì bỏ cái đó, không độn chữ cho cân. */}
              {(chip || kicker) && (
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-px w-8 flex-shrink-0 bg-brand-on-dark/70" aria-hidden="true" />
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-brand-on-dark">
                    {[chip, kicker].filter(Boolean).join(' · ')}
                  </p>
                </div>
              )}

              {/* Chữ hero dùng SplitText của thư viện React Bits (GSAP) thay vì tự viết hiệu ứng:
                  từng TỪ hiện lên so le khi slide vào khung nhìn.
                  DÙNG splitType 'words' CHỨ KHÔNG 'chars' — tiếng Việt có dấu là ký tự tổ hợp, tách
                  theo từng ký tự sẽ làm dấu rời khỏi chữ cái ("Đêm" thành "Ð ê m" mất mũ). Tách
                  theo từ vẫn đủ hiệu ứng mà không đụng vào dấu.
                  `key={event.id}` để mỗi lần đổi slide là chạy lại hiệu ứng, không thì slide thứ
                  hai trở đi sẽ hiện thẳng ra không có gì.
                  Bọc MotionGuard: thư viện KHÔNG tự xử lý prefers-reduced-motion, bật cờ đó thì
                  hiện thẳng tiêu đề tĩnh — cùng chữ, cùng cỡ, chỉ bỏ chuyển động.
                  Cỡ chữ/tracking/leading giữ nguyên ở cả hai nhánh để bố cục không nhảy. */}
              <MotionGuard
                khiTat={
                  <h2 className={TIEU_DE_HERO}>{event.name}</h2>
                }
              >
                <SplitText
                  key={event.id}
                  text={event.name}
                  tag="h2"
                  className={TIEU_DE_HERO}
                  splitType="words"
                  textAlign="left"
                  delay={40}
                  duration={0.8}
                  from={{ opacity: 0, y: 28 }}
                  to={{ opacity: 1, y: 0 }}
                />
              </MotionGuard>
              <p className="flex items-center gap-1.5 text-cream-mute text-sm md:text-base mb-7">
                <MapPin size={16} className="flex-shrink-0" />
                <span>{event.loungeName}{event.loungeCity ? ` · ${event.loungeCity}` : ''}</span>
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to={`/shows/${event.id}`}
                  className="inline-flex items-center gap-2 bg-brand text-on-brand hover:bg-brand-hover px-7 py-3.5 rounded-full font-bold transition-all duration-200 active:scale-95"
                >
                  Đặt vé ngay <ArrowRight size={18} />
                </Link>
                {price && (
                  <span className="text-cream text-sm md:text-base">
                    Từ <span className="font-semibold text-brand-on-dark">{price}</span>
                  </span>
                )}
                <button
                  onClick={(e) => handleToggleWishlist(e, event.id, isWishlisted)}
                  aria-label={isWishlisted ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
                  className={`flex items-center justify-center w-12 h-12 rounded-full border transition-colors backdrop-blur-sm ${isWishlisted ? 'bg-danger/20 border-danger text-danger' : 'bg-espresso/40 border-cream/30 text-cream hover:bg-espresso/70'}`}
                >
                  <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {/* Mũi tên điều hướng — chỉ hiện khi hover, ẩn khỏi luồng bàn phím lúc không cần thiết vì đã có dots. */}
      {events.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            aria-label="Buổi diễn trước"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-espresso/50 backdrop-blur-sm border border-cream/20 flex items-center justify-center text-cream opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-300 hover:bg-brand hover:text-on-brand hover:border-brand"
          >
            <ArrowRight size={18} className="rotate-180" />
          </button>
          <button
            onClick={goToNext}
            aria-label="Buổi diễn tiếp theo"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-espresso/50 backdrop-blur-sm border border-cream/20 flex items-center justify-center text-cream opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-300 hover:bg-brand hover:text-on-brand hover:border-brand"
          >
            <ArrowRight size={18} />
          </button>

          <div className="absolute bottom-6 right-6 md:right-14 flex items-center gap-2 z-40">
            {/* Nút tạm dừng — luật "Auto-Rotating Content Controls" (mức High): không được tự
                chuyển slide mà thiếu chỗ dừng. Nút LUÔN hiện, không ẩn theo hover như hai mũi tên,
                vì thứ dùng để dừng một chuyển động không mong muốn thì phải thấy ngay.
                Khi người dùng đã bật "giảm chuyển động" thì băng chuyền vốn đã đứng yên, nút mất ý
                nghĩa nên ẩn hẳn thay vì hiện một nút bấm không đổi gì. */}
            {!giamChuyenDong && (
              <button
                onClick={() => setNguoiDungDaDung((v) => !v)}
                aria-label={nguoiDungDaDung ? 'Tiếp tục tự chuyển buổi diễn' : 'Tạm dừng tự chuyển buổi diễn'}
                className="w-11 h-11 mr-1 rounded-full bg-espresso/50 backdrop-blur-sm border border-cream/20 flex items-center justify-center text-cream hover:bg-brand hover:text-on-brand hover:border-brand transition-colors"
              >
                {nguoiDungDaDung ? <Play size={16} /> : <Pause size={16} />}
              </button>
            )}
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Đến buổi diễn thứ ${index + 1}`}
                aria-current={index === currentIndex}
                className="h-11 px-1 inline-flex items-center group/dot"
              >
                <span className={`block h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-8 bg-brand' : 'w-4 bg-cream/40 group-hover/dot:bg-cream/70'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default HeroBanner
