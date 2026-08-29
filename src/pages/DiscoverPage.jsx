// src/pages/DiscoverPage.jsx
import { useState, useMemo, useEffect } from 'react'
import { X, CalendarDays } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import dayjs from 'dayjs'
import EventCarousel from '../components/home/EventCarousel'
import EventCard from '../components/home/EventCard'
import SectionHeader from '../components/home/SectionHeader'
import FilterModal from '../components/home/FilterModal'
import Skeleton from '../components/shared/Skeleton'
import { showService } from '../services/showService'

const initialFilterState = {
  selectedProvince: null, selectedDistricts: [], selectedWards: [],
  selectedGenres: [], selectedSubGenres: [], selectedSpaces: [], selectedMoods: [],
  minPrice: '', maxPrice: '',
}

const RemovableTag = ({ label, onRemove, icon: Icon }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-800 rounded-full text-xs font-medium text-gray-200 border border-gray-700 whitespace-nowrap">
    {Icon && <Icon size={12} className="text-[#C3B665] flex-shrink-0" />}
    <span className="truncate max-w-[120px] sm:max-w-none">{label}</span>
    <button onClick={onRemove} className="hover:text-red-400 ml-0.5 flex-shrink-0"><X size={12} /></button>
  </span>
)

// Map BE show object to EventCard props
function mapShowToEvent(show) {
  return {
    id: show.id,
    title: show.name,
    thumbnail: show.coverImageUrl,
    start_date: show.scheduledStart,
    province: show.loungeCity || show.lounge?.city || '',
    genre: show.genres && show.genres.length > 0 ? show.genres[0].name : 'Khác',
    mood: show.moods?.[0]?.name || 'Cảm xúc',
    space: show.atmospheres?.[0]?.name || 'Cozy',
    subGenre: '',
    priceValue: show.minPrice || 0,
    price: show.minPrice == null && show.maxPrice == null
      ? 'Miễn phí'
      : show.minPrice === show.maxPrice
        ? `${(show.minPrice || 0).toLocaleString('vi-VN')}đ`
        : `Từ ${(show.minPrice || 0).toLocaleString('vi-VN')}đ`,
  }
}

const DiscoverPage = () => {
  const { searchQuery = '' } = useOutletContext() || {}

  const [shows, setShows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch shows from real API
  useEffect(() => {
    const fetchShows = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [publishedRes, trendingRes] = await Promise.all([
          showService.getPublished({ page: 1, pageSize: 50, sortBy: 'Newest' }),
          showService.getTrending({ limit: 10 }),
        ])

        // Combine unique shows from both responses
        const publishedItems = publishedRes?.success ? (publishedRes.data?.items || []) : []
        const trendingItems = trendingRes?.success ? (trendingRes.data || []) : []

        const allShows = [...trendingItems, ...publishedItems]
        const uniqueShows = allShows.reduce((acc, show) => {
          if (!acc.find(s => s.id === show.id)) acc.push(show)
          return acc
        }, [])

        setShows(uniqueShows)
      } catch (err) {
        console.error('Failed to fetch shows:', err)
        setError('Không thể tải dữ liệu. Vui lòng thử lại.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchShows()
  }, [])

  const mappedEvents = useMemo(() => shows.map(mapShowToEvent), [shows])

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState(initialFilterState)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const removeFromFilterArray = (key, item) => setAppliedFilters(prev => ({ ...prev, [key]: prev[key].filter(i => i !== item) }))

  const searchResults = searchQuery.trim() === '' ? mappedEvents : mappedEvents.filter(ev => ev.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const finalFilteredEvents = searchResults.filter(ev => {
    const f = appliedFilters
    if (f.selectedProvince && ev.province !== f.selectedProvince) return false
    if (f.selectedGenres.length > 0 && !f.selectedGenres.includes(ev.genre)) return false
    if (f.minPrice && (ev.priceValue || 0) < Number(f.minPrice)) return false
    if (f.maxPrice && (ev.priceValue || 0) > Number(f.maxPrice)) return false
    if (startDate && dayjs(ev.start_date).format('YYYY-MM-DD') < startDate) return false
    if (endDate && dayjs(ev.start_date).format('YYYY-MM-DD') > endDate) return false
    return true
  })

  const isSearching = searchQuery.trim() !== ''
  const isFiltering = Object.values(appliedFilters).some(val => Array.isArray(val) ? val.length > 0 : val !== null && val !== '') || startDate || endDate
  const isActiveMode = isSearching || isFiltering

  // Group by genre from flat array
  const genreSections = useMemo(() => {
    const groups = {}
    mappedEvents.forEach(ev => {
      if (!groups[ev.genre]) groups[ev.genre] = []
      groups[ev.genre].push(ev)
    })
    return Object.keys(groups).map(genreName => ({
      genreId: genreName.toLowerCase(),
      genreName: genreName,
      slug: `/search?genre=${genreName.toLowerCase()}`,
      events: groups[genreName]
    }))
  }, [mappedEvents])

  const featuredShows = useMemo(() => mappedEvents.slice(0, 5), [mappedEvents])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 pt-6 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>
        <div className="mb-12">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8">
            {[...Array(5)].map((_, i) => (
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

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#C3B665] text-black rounded-lg font-medium">
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <SectionHeader onOpenFilter={() => setIsFilterOpen(true)} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
        {isFiltering && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center pb-3 sm:pb-4">
            {appliedFilters.selectedProvince && (<RemovableTag label={appliedFilters.selectedProvince} onRemove={() => setAppliedFilters(prev => ({ ...prev, selectedProvince: null }))} />)}
            {appliedFilters.selectedGenres.map(g => (<RemovableTag key={g} label={g} onRemove={() => removeFromFilterArray('selectedGenres', g)} />))}
            {(appliedFilters.minPrice || appliedFilters.maxPrice) && (<RemovableTag label={appliedFilters.minPrice && appliedFilters.maxPrice ? `${Number(appliedFilters.minPrice).toLocaleString('vi-VN')}đ - ${Number(appliedFilters.maxPrice).toLocaleString('vi-VN')}đ` : appliedFilters.minPrice ? `Từ ${Number(appliedFilters.minPrice).toLocaleString('vi-VN')}đ` : `Đến ${Number(appliedFilters.maxPrice).toLocaleString('vi-VN')}đ`} onRemove={() => setAppliedFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))} />)}
            {(startDate || endDate) && (<RemovableTag icon={CalendarDays} label={startDate && endDate ? `${startDate} → ${endDate}` : startDate ? `Từ ${startDate}` : `Đến ${endDate}`} onRemove={() => { setStartDate(''); setEndDate('') }} />)}
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16 space-y-8 sm:space-y-12 lg:space-y-16">
        {isActiveMode ? (
          <section>
            <div className="mb-4 sm:mb-6 px-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-300">
                {isSearching ? `Kết quả tìm kiếm cho "${searchQuery}"` : `Kết quả lọc (${finalFilteredEvents.length})`}
              </h2>
            </div>
            {finalFilteredEvents.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-3 sm:gap-x-5 md:gap-x-6 gap-y-6 sm:gap-y-8">
                {finalFilteredEvents.map((ev) => (<EventCard key={ev.id} {...ev} />))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-20">
                <p className="text-lg sm:text-xl font-semibold text-white mb-2">Không tìm thấy kết quả.</p>
                <p className="text-sm text-gray-400">Thử thay đổi tìm kiếm hoặc bộ lọc.</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {featuredShows.length > 0 && (<section><EventCarousel title="Recommend" events={featuredShows} /></section>)}
            {genreSections.map((section) => (
              <section key={section.genreId}>
                <EventCarousel title={`Genre ${section.genreName}`} events={section.events} showViewMore={true} viewMoreLink={section.slug} />
              </section>
            ))}
            {mappedEvents.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl font-semibold text-white mb-2">Chưa có chương trình nào</p>
                <p className="text-sm text-gray-400">Hãy quay lại sau để xem các sự kiện mới!</p>
              </div>
            )}
          </>
        )}
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} initialFilters={appliedFilters} onApply={setAppliedFilters} />
    </div>
  )
}

export default DiscoverPage