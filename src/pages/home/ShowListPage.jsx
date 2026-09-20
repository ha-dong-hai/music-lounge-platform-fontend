// src/pages/home/ShowListPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - TRANG NÀY TRƯỚC ĐÂY HỎNG THẬT: nó đọc một biến `HOME_DATA` không còn tồn tại (dữ liệu giả đã bị
//   bỏ), nên mở /shows là trang trắng kèm lỗi "HOME_DATA is not defined". Không có chỗ nào trong
//   giao diện dẫn tới nó nên lỗi không ai thấy — nhưng ai gõ URL hay mở bookmark cũ vẫn gặp.
// - Nay dựng lại trên API thật: GET /lounge-shows (danh sách công khai, Published + Ongoing).
//   Đây là trang XEM TẤT CẢ, không phải trang tìm kiếm — có lọc thì dùng /shows/search.
// - `sortBy` nhận đúng 5 giá trị của backend: Newest | Popular | PriceAsc | PriceDesc | StartingSoon.
//   Gửi tên khác là 400, nên danh sách sắp xếp lấy thẳng từ hằng số dưới đây.
// - Hai tham số lọc theo thể loại / tâm trạng KHÔNG có ở endpoint này. Trước đây trang tự lọc bằng
//   `ev.genre === 'Rock'` trên dữ liệu giả — không thể làm vậy với dữ liệu thật. Nếu URL còn mang
//   ?genre= hoặc ?mood= (đường dẫn cũ), trang chuyển sang /shows/search để bộ lọc thật xử lý, thay
//   vì im lặng bỏ qua rồi hiện danh sách sai.
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, CalendarX2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ShowCard from '../../components/home/ShowCard'
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" className="p-2 hover:bg-[#C3B665]/20 rounded-full transition-colors flex-shrink-0">
              <ArrowLeft size={24} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold">Tất cả buổi diễn</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalCount > 0 ? `${totalCount.toLocaleString('vi-VN')} buổi diễn đang mở` : 'Danh sách buổi diễn công khai'}
                {' · '}
                <Link to="/shows/search" className="text-[#C3B665] hover:underline">tìm theo bộ lọc</Link>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <label htmlFor="sortBy" className="text-sm text-gray-500">Sắp xếp</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => doiCachSap(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50"
            >
              {CACH_SAP.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
        ) : shows.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <CalendarX2 size={34} className="mx-auto mb-4 text-gray-700" />
            <p className="text-lg font-semibold text-white mb-1">Chưa có buổi diễn nào đang mở</p>
            <p className="text-sm text-gray-500">Quay lại sau, hoặc thử tìm theo bộ lọc.</p>
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
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
              Trước
            </button>
            <span className="text-sm text-gray-500">Trang {page}/{totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShowListPage
