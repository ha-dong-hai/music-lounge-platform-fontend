// src/pages/home/ShowListPage.jsx

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { SlidersHorizontal, CalendarX2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import ShowCard from '../../components/home/ShowCard'
import Skeleton from '../../components/shared/Skeleton'
import { getShows } from '../../services/showServices'

const CACH_SAP = [
  { value: 'Newest', label: 'Mới nhất' },
  { value: 'StartingSoon', label: 'Sắp diễn' },
  { value: 'Popular', label: 'Được xem nhiều' },
  { value: 'PriceAsc', label: 'Giá thấp đến cao' },
  { value: 'PriceDesc', label: 'Giá cao đến thấp' },
]

const TRANG = 12

const fmtGia = (s) => (
  s.minPrice === 0 && s.maxPrice === 0
    ? 'Miễn phí'
    : `${Number(s.minPrice || 0).toLocaleString('vi-VN')}đ`
)

const ShowListPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [shows, setShows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('Newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Đường dẫn cũ dạng /shows?genre=rock — chuyển sang trang tìm kiếm, nơi có bộ lọc thật theo id.
  // Làm trong effect vì đây là điều hướng theo URL, không phải theo hành động của người dùng.
  const genreSlug = searchParams.get('genre')
  const moodSlug = searchParams.get('mood')
  useEffect(() => {
    if (genreSlug || moodSlug) {
      navigate('/shows/search', { replace: true })
    }
  }, [genreSlug, moodSlug, navigate])

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getShows({ page, pageSize: TRANG, sortBy, includeSoldOut: true })
      if (res.success) {
        setShows(res.data?.items ?? [])
        setTotalPages(res.data?.totalPages ?? 1)
        setTotalCount(res.data?.totalCount ?? 0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách buổi diễn.')
      setShows([])
    } finally {
      setIsLoading(false)
    }
  }, [page, sortBy])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // Đổi cách sắp xếp thì về trang 1 — đặt lại ngay trong handler, không qua effect.
  const doiCachSap = (v) => { setSortBy(v); setPage(1) }
  // Sang trang khác thì đưa người xem về đầu danh sách: nếu không họ đang đứng ở cuối trang cũ và thấy ngay cuối trang mới.
  const sangTrang = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="min-h-[60vh] bg-page text-ink">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ĐẦU TRANG — cùng khuôn với "Khám phá phòng trà": tiêu đề rõ nghĩa + một câu nói trang này để làm gì.
            Bỏ mũi tên quay lại riêng: logo và thanh điều hướng của Header đã dẫn về trang chủ ở mọi trang. */}
        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Tất cả buổi diễn</h1>
          <p className="text-ink-soft mt-1.5 max-w-xl leading-relaxed">
            Mọi đêm diễn đang mở bán. Muốn lọc theo thể loại, giá hay ngày, hãy dùng tìm kiếm nâng cao.
          </p>
        </div>

        {/* THANH CÔNG CỤ — lối sang bộ lọc nằm ngay tầm mắt (trước đây chỉ là một dòng chữ nhỏ trong đoạn mô tả). */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Link
            to="/shows/search"
            className="h-12 px-5 inline-flex items-center gap-2 rounded-full bg-espresso text-cream text-sm font-medium hover:bg-espresso-soft transition-colors"
          >
            <SlidersHorizontal size={16} /> Tìm và lọc buổi diễn
          </Link>

          <div className="relative">
            <label htmlFor="sortBy" className="sr-only">Sắp xếp buổi diễn</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => doiCachSap(e.target.value)}
              className="appearance-none h-12 pl-5 pr-11 bg-card border border-line-strong rounded-full text-sm text-ink hover:border-brand focus:outline-none focus:border-brand-text focus:ring-2 focus:ring-brand/30 transition-colors cursor-pointer"
            >
              {CACH_SAP.map((c) => <option key={c.value} value={c.value}>Sắp xếp: {c.label}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none" />
          </div>

          {!isLoading && totalCount > 0 && (
            <p className="text-sm text-ink-mute ml-auto" aria-live="polite">
              {totalCount.toLocaleString('vi-VN')} buổi diễn
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-busy="true" aria-label="Đang tải danh sách">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full aspect-video rounded-xl" />
                <Skeleton className="h-5 w-3/4 mt-4" />
                <Skeleton className="h-3 w-1/2 mt-2.5" />
              </div>
            ))}
          </div>
        ) : shows.length === 0 ? (
          <div className="bg-card border border-line rounded-2xl p-10 sm:p-16 text-center">
            <CalendarX2 size={34} className="mx-auto mb-4 text-ink-mute" />
            <p className="font-display text-xl text-ink mb-1">Chưa có buổi diễn nào đang mở</p>
            <p className="text-sm text-ink-soft mb-5">Quay lại sau, hoặc xem các phòng trà để biết nơi nào sắp có đêm diễn mới.</p>
            <Link to="/lounges" className="inline-flex items-center min-h-[44px] px-6 rounded-full bg-brand text-on-brand font-bold text-sm hover:bg-brand-hover transition-colors">
              Xem các phòng trà
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shows.map((s) => (
              <ShowCard
                key={s.id}
                id={s.id}
                title={s.name}
                thumbnail={s.coverImageUrl}
                start_date={s.scheduledStart}
                location={s.loungeName}
                price={fmtGia(s)}
                format={s.format}
                isWishlisted={s.isWishlisted ?? false}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Phân trang" className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => sangTrang(Math.max(1, page - 1))} disabled={page <= 1}
              className="min-h-[44px] px-5 rounded-full border border-line-strong bg-card text-sm font-medium text-ink hover:border-brand disabled:opacity-40 disabled:hover:border-line-strong disabled:cursor-not-allowed transition-colors">
              Trước
            </button>
            <span className="text-sm text-ink-soft tabular-nums" aria-live="polite">Trang {page}/{totalPages}</span>
            <button onClick={() => sangTrang(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="min-h-[44px] px-5 rounded-full border border-line-strong bg-card text-sm font-medium text-ink hover:border-brand disabled:opacity-40 disabled:hover:border-line-strong disabled:cursor-not-allowed transition-colors">
              Sau
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}

export default ShowListPage