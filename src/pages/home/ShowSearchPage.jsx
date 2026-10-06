// src/pages/home/EventSearchPage.jsx
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, CalendarDays, SearchX, AlertCircle } from 'lucide-react'
import ShowCard from '../../components/home/ShowCard'
import Skeleton from '../../components/shared/Skeleton'
import SectionHeader from '../../components/home/SectionHeader'
import FilterModal from '../../components/home/FilterModal'
import { getShows, searchShows, getFilterOptions } from '../../services/showServices'
import dayjs from 'dayjs'
import { formatMinPrice } from '../../utils/formatPrice'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '../../i18n/format'

const initialFilterState = {
  // MLACP-522: tỉnh/phường theo danh mục hành chính — tên để hiện nhãn, mã để gửi lên tìm kiếm.
  selectedProvince: null, selectedProvinceCode: null, selectedWard: null, selectedWardCode: null,
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

const fmtVnd = formatMoney

// Cả viên là một nút: bấm đâu cũng bỏ được bộ lọc đó (trước đây chỉ có nút X 12px).
const RemovableTag = ({ label, onRemove, ariaLabel, icon: Icon }) => (
  <button
    type="button"
    onClick={onRemove}
    aria-label={ariaLabel || `Bỏ lọc ${label}`}
    className="group inline-flex items-center gap-1.5 min-h-[44px] pl-4 pr-3 bg-card rounded-full text-sm font-medium text-ink border border-line-strong hover:border-danger/60 hover:text-danger transition-colors max-w-full"
  >
    {Icon && <Icon size={14} className="text-brand-text group-hover:text-danger flex-shrink-0" />}
    <span className="truncate">{label}</span>
    <X size={14} className="text-ink-mute group-hover:text-danger flex-shrink-0" />
  </button>
)

const ShowSearchPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const keyword = searchParams.get('keyword') || ''
  const genreId = searchParams.get('genreId')

  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(null)

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

  // TIÊU ĐỀ TRANG — suy ra từ dữ liệu, không cần state + effect.
  const pageTitle = useMemo(() => {
    if (!genreId) return keyword ? t('search.resultsFor', { keyword }) : t('search.title')
    const genre = filterOptions.genres.find(g => String(g.id) === String(genreId))
    return genre ? t('search.genreTitle', { name: genre.name }) : t('search.title')
  }, [genreId, keyword, filterOptions, t])

  const isFiltering = Object.values(appliedFilters).some(val => Array.isArray(val) ? val.length > 0 : val !== null && val !== '') || Boolean(startDate || endDate)

  // TRANG HIỆN TẠI — gắn với "dấu vân tay" của bộ lọc: đổi từ khoá/bộ lọc/ngày thì page tự về 1 ngay trong lúc render.
  // Bản cũ dùng một effect để reset về 1, nhưng effect chạy SAU lượt tải đầu: đang ở trang 2 mà đổi bộ lọc thì trang gửi hai
  // request (page=2 với bộ lọc mới, rồi page=1) và thoáng hiện kết quả sai trang.
  const filterKey = JSON.stringify([keyword, genreId, appliedFilters, startDate, endDate])
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1

  // GỌI API SEARCH
  useEffect(() => {
    const fetchShows = async () => {
      setIsLoading(true)
      setApiError(null) // lần tải mới thì lỗi của lần trước hết hiệu lực — không xoá thì khách kẹt ở màn lỗi mãi
      try {
        let res;
        const commonParams = { page, pageSize: 12, includeSoldOut: true }

        const filtering = Object.values(appliedFilters).some(val => Array.isArray(val) ? val.length > 0 : val !== null && val !== '') || startDate || endDate

        if (keyword || genreId || filtering) {
          // Thể loại đến từ hai nguồn: tham số genreId trên URL, và lựa chọn trong modal.
          // Gộp lại và bỏ trùng để không gửi một id hai lần.
          const genreIdsFromModal = namesToIds(appliedFilters.selectedGenres, filterOptions.genres) || []
          const genreIds = [...new Set([...(genreId ? [genreId] : []), ...genreIdsFromModal])]

          const params = {
            ...commonParams,
            keyword: keyword || undefined,
            // MLACP-522: lọc theo MÃ tỉnh/phường (QĐ 19/2025) thay cho chuỗi tên thành phố.
            provinceCode: appliedFilters.selectedProvinceCode || undefined,
            wardCode: appliedFilters.selectedWardCode || undefined,
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
            loungeName: show.loungeName,
            genre: show.genres && show.genres.length > 0 ? show.genres[0].name : 'Other',
            price: formatMinPrice(show),
            format: show.format,
            isWishlisted: show.isWishlisted
          }))
          setEvents(mapped)
          setTotalPages(res.data.totalPages)
          setTotalCount(typeof res.data.totalCount === 'number' ? res.data.totalCount : null)
        } else {
          setApiError(res.message || 'Không tải được danh sách buổi diễn.')
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
            : t('search.connectionError')
        )
      } finally {
        setIsLoading(false)
      }
    }
    fetchShows()
  }, [keyword, genreId, appliedFilters, startDate, endDate, page, filterOptions])

  const removeFromFilterArray = (key, item) => setAppliedFilters(prev => ({ ...prev, [key]: prev[key].filter(i => i !== item) }))

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters)
    setIsFilterOpen(false)
  }

  const clearAllFilters = () => {
    setAppliedFilters(initialFilterState)
    setStartDate('')
    setEndDate('')
  }

  const sangTrang = (delta) => {
    setPageState({ key: filterKey, page: page + delta })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const priceLabel = appliedFilters.minPrice && appliedFilters.maxPrice
    ? `${fmtVnd(appliedFilters.minPrice)} – ${fmtVnd(appliedFilters.maxPrice)}`
    : appliedFilters.minPrice ? `${t('common.from', { value: fmtVnd(appliedFilters.minPrice) })}` : appliedFilters.maxPrice ? `${t('common.to', { value: fmtVnd(appliedFilters.maxPrice) })}` : ''

  const fmtNgay = (d) => dayjs(d).format('DD/MM/YYYY')

  const pagerBtn = 'w-11 h-11 inline-flex items-center justify-center rounded-full border border-line-strong bg-card text-ink hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-line-strong disabled:hover:text-ink transition-colors'

  return (
    <div className="min-h-[60vh] bg-page text-ink">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10">

        {/* ĐẦU TRANG — cùng khuôn với "Khám phá phòng trà" và "Tất cả buổi diễn". Bỏ mũi tên quay lại riêng:
            logo/điều hướng của Header đã dẫn về trang chủ ở mọi trang. */}
        <div className="mb-4">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink break-words">{pageTitle}</h1>
          <p className="text-ink-soft mt-1.5 leading-relaxed" aria-live="polite">
            {isLoading
              ? t('search.searching')
              : totalCount != null
                ? t('common.showsCount', { n: totalCount, count: totalCount })
                : t('search.hint')}
          </p>
        </div>

        <SectionHeader
          onOpenFilter={() => setIsFilterOpen(true)}
          appliedFilters={appliedFilters}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
        />

        {isFiltering && (
          <div className="flex flex-wrap gap-2 items-center pb-4">
            {appliedFilters.selectedProvince && (<RemovableTag label={appliedFilters.selectedProvince} ariaLabel={t('search.removeFilter', { label: appliedFilters.selectedProvince })} onRemove={() => setAppliedFilters(prev => ({ ...prev, selectedProvince: null, selectedProvinceCode: null, selectedWard: null, selectedWardCode: null }))} />)}
            {appliedFilters.selectedWard && (<RemovableTag label={appliedFilters.selectedWard} ariaLabel={t('search.removeFilter', { label: appliedFilters.selectedWard })} onRemove={() => setAppliedFilters(prev => ({ ...prev, selectedWard: null, selectedWardCode: null }))} />)}
            {appliedFilters.selectedGenres.map(g => (<RemovableTag key={g} label={g} ariaLabel={t('search.removeFilter', { label: g })} onRemove={() => removeFromFilterArray('selectedGenres', g)} />))}
            {appliedFilters.selectedSpaces.map(s => (<RemovableTag key={s} label={s} ariaLabel={t('search.removeFilter', { label: s })} onRemove={() => removeFromFilterArray('selectedSpaces', s)} />))}
            {appliedFilters.selectedMoods.map(m => (<RemovableTag key={m} label={m} ariaLabel={t('search.removeFilter', { label: m })} onRemove={() => removeFromFilterArray('selectedMoods', m)} />))}
            {(appliedFilters.minPrice || appliedFilters.maxPrice) && (<RemovableTag label={priceLabel} ariaLabel={t('search.removeFilter', { label: priceLabel })} onRemove={() => setAppliedFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))} />)}
            {(startDate || endDate) && (
              <RemovableTag
                icon={CalendarDays}
                label={startDate && endDate ? `${fmtNgay(startDate)} → ${fmtNgay(endDate)}` : startDate ? `${t('common.from', { value: fmtNgay(startDate) })}` : `${t('common.to', { value: fmtNgay(endDate) })}`}
                ariaLabel={t('search.removeFilter', { label: 'Date' })}
                onRemove={() => { setStartDate(''); setEndDate('') }}
              />
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="min-h-[44px] px-3 text-sm font-medium text-brand-text hover:underline underline-offset-4"
            >
              {t('search.clearAll')}
            </button>
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-8" aria-busy="true" aria-label={t('search.loadingResults')}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="w-full aspect-video rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : apiError ? (
          // Lỗi hiện NGAY TRONG vùng kết quả, bộ lọc phía trên vẫn dùng được để sửa (ví dụ khoảng giá sai).
          <div role="alert" className="max-w-lg mx-auto bg-card border border-danger/30 rounded-2xl p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-danger" />
            <p className="font-display text-xl text-ink mb-1">{t('search.errorTitle')}</p>
            <p className="text-sm text-ink-soft mb-5 leading-relaxed">{apiError}</p>
            {isFiltering && (
              <button onClick={clearAllFilters} className="inline-flex items-center min-h-[44px] px-6 rounded-full bg-brand text-on-brand font-bold text-sm hover:bg-brand-hover transition-colors">
                {t('search.clearAndRetry')}
              </button>
            )}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-8">
            {events.map((ev) => (<ShowCard key={ev.id} {...ev} />))}
          </div>
        ) : (
          <div className="max-w-lg mx-auto text-center py-16">
            <SearchX size={34} className="mx-auto mb-4 text-ink-mute" />
            <p className="font-display text-2xl text-ink mb-1.5">{t('search.emptyTitle')}</p>
            <p className="text-ink-soft leading-relaxed mb-6">
              {isFiltering || keyword || genreId
                ? t('search.emptyFiltered')
                : t('search.emptyAll')}
            </p>
            {isFiltering ? (
              <button onClick={clearAllFilters} className="inline-flex items-center min-h-[44px] px-6 rounded-full bg-brand text-on-brand font-bold text-sm hover:bg-brand-hover transition-colors">
                {t('search.clearAll')}
              </button>
            ) : (
              <Link to="/lounges" className="inline-flex items-center min-h-[44px] px-6 rounded-full bg-brand text-on-brand font-bold text-sm hover:bg-brand-hover transition-colors">
                {t('common.viewLounges')}
              </Link>
            )}
          </div>
        )}

        {!isLoading && !apiError && events.length > 0 && totalPages > 1 && (
          <nav aria-label="Phân trang" className="flex items-center justify-between p-4 mt-8">
            <p className="text-sm text-ink-soft tabular-nums" aria-live="polite">{t('search.pageOf', { page, total: totalPages })}</p>
            <div className="flex gap-2">
              <button onClick={() => sangTrang(-1)} disabled={page === 1} aria-label={t('common.prevPage')} className={pagerBtn}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => sangTrang(1)} disabled={page === totalPages} aria-label={t('common.nextPage')} className={pagerBtn}>
                <ChevronRight size={18} />
              </button>
            </div>
          </nav>
        )}
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} initialFilters={appliedFilters} onApply={handleApplyFilters} />
    </div>
  )
}

export default ShowSearchPage
