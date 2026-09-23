// src/components/home/HeroBanner.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, ArrowRight } from 'lucide-react'
import dayjs from 'dayjs'
import { toggleWishlist } from '../../services/interactionServices'
import toast from 'react-hot-toast'
import CoverFallback from '../shared/CoverFallback'

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

  // Tự động chuyển slide mỗi 10 giây.
  // Thêm currentIndex vào dependencies để mỗi lần bấm nút manual, bộ đếm 10s sẽ reset lại.
  useEffect(() => {
    if (events.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [events.length, currentIndex])

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
    <div className="relative w-full h-[480px] md:h-[600px] rounded-2xl overflow-hidden border border-line shadow-glow group">
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
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {chip && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-espresso bg-brand px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-espresso animate-pulse" aria-hidden="true" />
                    {chip}
                  </span>
                )}
                {kicker && (
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-on-dark">
                    {kicker}
                  </span>
                )}
              </div>

              <h2 className="font-display text-3xl md:text-5xl font-semibold leading-tight text-cream mb-3">
                {event.name}
              </h2>
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

          <div className="absolute bottom-6 right-6 md:right-14 flex gap-2 z-40">
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