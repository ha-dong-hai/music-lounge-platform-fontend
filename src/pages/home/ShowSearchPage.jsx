// src/pages/home/EventSearchPage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react'
import ShowCard from '../../components/home/ShowCard'
import Skeleton from '../../components/shared/Skeleton'
import SectionHeader from '../../components/home/SectionHeader'
import FilterModal from '../../components/home/FilterModal'
import { getShows, searchShows, getFilterOptions } from '../../services/showServices'
import dayjs from 'dayjs'

const initialFilterState = {
  selectedProvince: null,
  selectedGenres: [], selectedSpaces: [], selectedMoods: [],
  minPrice: '', maxPrice: '',
}

// FilterModal lưu TÊN của thể loại / tâm trạng / không gian, còn API cần ID.
// Đổi tên → id ở đây, và BỎ những tên không khớp thay vì để undefined lọt vào mảng:
// axios sẽ serialize undefined thành tham số rỗng và backend nhận một mảng id hỏng.
// Mất thầm một bộ lọc vẫn hơn gửi truy vấn sai.
// Tên có thể không khớp nếu Admin đổi tên mục sau khi người dùng đã chọn (bộ lọc được
// chụp lại qua navigate state), hoặc nếu sau này tồn tại hai mục trùng tên — backend
// KHÔNG bảo đảm tên duy nhất vì Admin có CRUD taxonomy.
const namesToIds = (names, options) => {
  if (!names || names.length === 0 || !options || options.length === 0) return undefined
  const ids = names
    .map(name => options.find(o => o.name === name)?.id)
    .filter(id => id !== undefined && id !== null)
  return ids.length > 0 ? ids : undefined
}

const RemovableTag = ({ label, onRemove, icon: Icon }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-800 rounded-full text-xs font-medium text-gray-200 border border-gray-700 whitespace-nowrap">
    {Icon && <Icon size={12} className="text-[#C3B665] flex-shrink-0" />}
    <span className="truncate max-w-[120px] sm:max-w-none">{label}</span>
    <button onClick={onRemove} className="hover:text-red-400 ml-0.5 flex-shrink-0"><X size={12} /></button>
  </span>
)

const ShowSearchPage = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const keyword = searchParams.get('keyword') || ''
  const genreId = searchParams.get('genreId')

  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [pageTitle, setPageTitle] = useState("List of shows")

  const [filterOptions, setFilterOptions] = useState({ genres: [], moods: [], atmospheres: [], cities: [] })

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  // ⭐ LẤY STATE TỪ HOMEPAGE TRUYỀN QUA, NẾU KHÔNG CÓ THÌ DÙNG DEFAULT
  const [appliedFilters, setAppliedFilters] = useState(location.state?.appliedFilters || initialFilterState)
  const [startDate, setStartDate] = useState(location.state?.startDate || '')
  const [endDate, setEndDate] = useState(location.state?.endDate || '')

  // TẢI TUỲ CHỌN LỌC MỘT LẦN — dùng cho cả tiêu đề trang và việc đổi tên → id khi gọi search
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getFilterOptions()
        if (res.success) setFilterOptions(res.data)
      } catch (err) { console.error('Error retrieving filter options:', err) }
    }
    fetchOptions()
  }, [])

  // TIÊU ĐỀ TRANG
  useEffect(() => {
    if (!genreId) {
      setPageTitle(keyword ? `Search results: "${keyword}"` : "List of shows")
      return
    }
    const genre = filterOptions.genres.find(g => String(g.id) === String(genreId))
    setPageTitle(genre ? `Genre ${genre.name}` : "List of shows")
  }, [genreId, keyword, filterOptions])

  // GỌI API SEARCH
  useEffect(() => {
    const fetchShows = async () => {
      setIsLoading(true)
      try {
        let res;
        const commonParams = { page: pagination.page, pageSize: 12, includeSoldOut: true }

        const isFiltering = Object.values(appliedFilters).some(val => Array.isArray(val) ? val.length > 0 : val !== null && val !== '') || startDate || endDate

        if (keyword || genreId || isFiltering) {
          // Thể loại đến từ hai nguồn: tham số genreId trên URL, và lựa chọn trong modal.
          // Gộp lại và bỏ trùng để không gửi một id hai lần.
          const genreIdsFromModal = namesToIds(appliedFilters.selectedGenres, filterOptions.genres) || []
          const genreIds = [...new Set([...(genreId ? [Number(genreId)] : []), ...genreIdsFromModal])]

          const params = {
            ...commonParams,
            keyword: keyword || undefined,
            city: appliedFilters.selectedProvince || undefined,
            dateFrom: startDate ? dayjs(startDate).toISOString() : undefined,
            dateTo: endDate ? dayjs(endDate).toISOString() : undefined,
            minPrice: appliedFilters.minPrice || undefined,
            maxPrice: appliedFilters.maxPrice || undefined,
            genreIds: genreIds.length > 0 ? genreIds : undefined,
            moodIds: namesToIds(appliedFilters.selectedMoods, filterOptions.moods),
            atmosphereIds: namesToIds(appliedFilters.selectedSpaces, filterOptions.atmospheres),
          }

          Object.keys(params).forEach(key => params[key] === undefined && delete params[key])
          res = await searchShows(params)
        } else {
          res = await getShows({ ...commonParams, sortBy: 'Newest' })
        }

        if (res.success) {
          const mapped = res.data.items.map(show => ({
            id: show.id,
            title: show.name,
            thumbnail: show.coverImageUrl,
            start_date: show.scheduledStart,
            genre: show.genres && show.genres.length > 0 ? show.genres[0].name : 'Other',
            price: show.minPrice === 0 && show.maxPrice === 0 ? 'Free' : `${show.minPrice.toLocaleString('vi-VN')}đ`,
            format: show.format,
            isWishlisted: show.isWishlisted
          }))
          setEvents(mapped)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages }))
        } else {
          setApiError(res.message || 'Data loading error')
        }
      } catch (err) {
        // Backend trả 400 kèm `message` tiếng Việt khi khoảng giá không hợp lệ (giá âm, giá
        // có phần lẻ, maxPrice < minPrice). Gộp nó vào "lỗi kết nối" là nói sai nguyên nhân:
        // người dùng gõ sai khoảng giá sẽ tưởng hệ thống đang hỏng. Hiện thẳng message của backend.
        const status = err?.response?.status
        const beMessage = err?.response?.data?.message
        setApiError(
          status >= 400 && status < 500 && beMessage
            ? beMessage
            : 'Unable to connect to backend.'
        )
      } finally {
        setIsLoading(false)
      }
    }
    fetchShows()
  }, [keyword, genreId, appliedFilters, startDate, endDate, pagination.page, filterOptions])

  // RESET TRANG VỀ 1 KHI ĐỔI FILTER
  useEffect(() => { setPagination(prev => ({ ...prev, page: 1 })) }, [keyword, genreId, appliedFilters, startDate, endDate])

  const removeFromFilterArray = (key, item) => setAppliedFilters(prev => ({ ...prev, [key]: prev[key].filter(i => i !== item) }))
  
  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters)
    setIsFilterOpen(false)
  }

  const isFiltering = Object.values(appliedFilters).some(val => Array.isArray(val) ? val.length > 0 : val !== null && val !== '') || startDate || endDate

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="w-full aspect-video rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white px-4">
        <div className="text-center max-w-md">
          <p className="text-2xl font-bold text-red-400 mb-3">Oops! Lỗi kết nối</p>
          <p className="text-gray-400 mb-6">{apiError}</p>
          <Link to="/" className="inline-block text-[#C3B665] font-semibold underline">Về trang chủ</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        
        <div className="flex items-center gap-4 mb-8 pt-4">
          <Link to="/" className="p-2 hover:bg-[#C3B665]/40 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-500">{pageTitle}</h1>
        </div>

        <SectionHeader 
          onOpenFilter={() => setIsFilterOpen(true)} 
          appliedFilters={appliedFilters}
          startDate={startDate} setStartDate={setStartDate} 
          endDate={endDate} setEndDate={setEndDate}
        />
        
        {isFiltering && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center pb-3 sm:pb-4">
            {appliedFilters.selectedProvince && (<RemovableTag label={appliedFilters.selectedProvince} onRemove={() => setAppliedFilters(prev => ({ ...prev, selectedProvince: null }))} />)}
            {appliedFilters.selectedGenres.map(g => (<RemovableTag key={g} label={g} onRemove={() => removeFromFilterArray('selectedGenres', g)} />))}
            {appliedFilters.selectedSpaces.map(s => (<RemovableTag key={s} label={s} onRemove={() => removeFromFilterArray('selectedSpaces', s)} />))}
            {appliedFilters.selectedMoods.map(m => (<RemovableTag key={m} label={m} onRemove={() => removeFromFilterArray('selectedMoods', m)} />))}
            {(appliedFilters.minPrice || appliedFilters.maxPrice) && (<RemovableTag label={appliedFilters.minPrice && appliedFilters.maxPrice ? `${Number(appliedFilters.minPrice).toLocaleString('vi-VN')}đ - ${Number(appliedFilters.maxPrice).toLocaleString('vi-VN')}đ` : appliedFilters.minPrice ? `From ${Number(appliedFilters.minPrice).toLocaleString('vi-VN')}đ` : `To ${Number(appliedFilters.maxPrice).toLocaleString('vi-VN')}đ`} onRemove={() => setAppliedFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))} />)}
            {(startDate || endDate) && (<RemovableTag icon={CalendarDays} label={startDate && endDate ? `${startDate} → ${endDate}` : startDate ? `From ${startDate}` : `To ${endDate}`} onRemove={() => { setStartDate(''); setEndDate('') }} />)}
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        {events.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-8">
            {events.map((ev) => (<ShowCard key={ev.id} {...ev} />))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy sự kiện nào</p>
            <p className="text-gray-500">Hiện chưa có sự kiện nào thuộc danh mục này.</p>
          </div>
        )}

        {events.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 mt-8">
            <p className="text-sm text-gray-500">Trang {pagination.page} / {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} initialFilters={appliedFilters} onApply={handleApplyFilters} />
    </div>
  )
}

export default ShowSearchPage