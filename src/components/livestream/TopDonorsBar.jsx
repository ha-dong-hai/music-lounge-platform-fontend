import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Trophy, Crown } from 'lucide-react'
import DonorLeaderboardModal from './DonorLeaderboardModal'
import { anhChuCai } from '../../utils/anhChuCai'

const STRIP_LIMIT = 10 //  Số donor tối đa hiển thị trên thanh ngang

const fmt = (v) => (v || 0).toLocaleString('vi-VN') + 'đ'

// ===== GOM GÓP DONATE THEO USER (tính tổng + số lượt) =====
const useAggregateDonors = (messages) => useMemo(() => {
  const map = new Map()
  messages.filter(m => m.type === 'donate').forEach(m => {
    // Key ưu tiên user.id (khi có SignalR thật), fallback về name
    const key = m.user?.id ?? m.user?.name ?? 'anonymous'
    const entry = map.get(key) || {
      key,
      name: m.user?.name || 'Ẩn danh',
      avatarUrl: m.user?.avatarUrl || null,
      total: 0,
      count: 0,
    }
    entry.total += m.amount || 0
    entry.count += 1
    map.set(key, entry)
  })
  return [...map.values()].sort((a, b) => b.total - a.total)
}, [messages])

const TopDonorsBar = ({ messages }) => {
  const donors = useAggregateDonors(messages)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Kiểm tra vị trí cuộn (pattern EventCarousel / HorizontalTagSlider)
  const checkScrollPosition = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
  }

  useEffect(() => {
    checkScrollPosition()
    window.addEventListener('resize', checkScrollPosition)
    return () => window.removeEventListener('resize', checkScrollPosition)
  }, [donors])

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
    }
  }

  // Chưa có donation nào → ẩn toàn bộ khu vực
  if (donors.length === 0) return null

  const topDonors = donors.slice(0, STRIP_LIMIT)

  return (
    <>
      <div className="flex-none border-b border-line bg-ink/30">

        {/* ===== LABEL + XEM TẤT CẢ ===== */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
          <span className="text-[11px] font-bold text-ink-soft flex items-center gap-1.5">
            <Trophy size={12} className="text-ink" /> Top donate
          </span>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="text-[11px] font-semibold text-ink hover:text-ink transition-colors"
          >
            Xem tất cả
          </button>
        </div>

        {/* ===== THANH CHIP CUỘN NGANG ===== */}
        <div className="relative group/strip">

          {/* Gradient + mũi tên trái */}
          <div className={`absolute inset-y-0 left-0 w-1 bg-lamp/40 z-10 pointer-events-none transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-ink/80 border border-lamp/10 text-lamp flex items-center justify-center opacity-0 group-hover/strip:opacity-100 hover:bg-board hover:text-lamp transition-all" aria-label="Cuộn sang trái">
              <ChevronLeft size={14} />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScrollPosition}
            className="flex gap-2 overflow-x-auto scroll-smooth hide-scrollbar px-4 pb-2.5 pt-0.5"
          >
            {topDonors.map((d, i) => (
              <div
                key={d.key}
                className="snap-start flex-shrink-0 flex items-center gap-2 py-1 pl-1 pr-3 bg-sunken/70 border border-line hover:border-ink/40 transition-colors cursor-default"
              >
                {/* Avatar (+ vương miện cho top 1) */}
                <div className="relative flex-shrink-0">
                  <img
                    src={d.avatarUrl || anhChuCai(d.name)}
                    alt={d.name}
                    className="w-7 h-7 object-cover border border-line-strong"
                  />
                  {i === 0 && (
                    <Crown size={11} className="absolute -top-1.5 -right-1.5 text-ink fill-ink" />
                  )}
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-medium text-ink max-w-[72px] truncate">{d.name}</p>
                  <p className="text-[10px] font-bold text-ink">{fmt(d.total)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gradient + mũi tên phải */}
          <div className={`absolute inset-y-0 right-0 w-1 bg-lamp/40 z-10 pointer-events-none transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-ink/80 border border-lamp/10 text-lamp flex items-center justify-center opacity-0 group-hover/strip:opacity-100 hover:bg-board hover:text-lamp transition-all" aria-label="Cuộn sang phải">
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ===== MODAL XẾP HẠNG ĐẦY ĐỦ ===== */}
      {showLeaderboard && (
        <DonorLeaderboardModal donors={donors} onClose={() => setShowLeaderboard(false)} />
      )}
    </>
  )
}

export default TopDonorsBar