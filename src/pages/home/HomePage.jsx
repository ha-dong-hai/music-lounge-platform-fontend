// src/pages/home/HomePage.jsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom' // ⭐ THÊM useNavigate
import EventCarousel from '../../components/home/ShowCarousel'
import SectionHeader from '../../components/home/SectionHeader'
import FilterModal from '../../components/home/FilterModal'
import Skeleton from '../../components/shared/Skeleton'
import HeroBanner from '../../components/home/HeroBanner'
import { getShows, getTrendingShows } from '../../services/showServices'

const initialFilterState = {
  selectedProvince: null, selectedDistricts: [], selectedWards: [],
  selectedGenres: [], selectedSubGenres: [], selectedSpaces: [], selectedMoods: [],
  minPrice: '', maxPrice: '',
}

const HomePage = () => {
  const navigate = useNavigate() // ⭐

  const [isLoading, setIsLoading] = useState(true)
  const [allEvents, setAllEvents] = useState([]) 
  const [trendingEvents, setTrendingEvents] = useState([])
  const [recommendEvents, setRecommendEvents] = useState([])

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState(initialFilterState)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 1. GỌI API TRENDING CHO HERO BANNER
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await getTrendingShows({ limit: 6 })
        if (res.success) setTrendingEvents(res.data)
      } catch (err) { console.error('Lỗi API Trending:', err) }
    }
    fetchTrending()
  }, [])

  // 2. GỌI API TRENDING CHO RECOMMEND CAROUSEL
  useEffect(() => {
    const fetchRecommend = async () => {
      try {
        const res = await getTrendingShows({ limit: 10 })
        if (res.success) {
          const mapped = res.data.map(show => ({
            id: show.id, title: show.name, thumbnail: show.coverImageUrl,
            start_date: show.scheduledStart, province: show.loungeCity,
            genre: show.genres?.[0]?.name || 'Khác', genreId: show.genres?.[0]?.id || null,
            price: show.minPrice === 0 && show.maxPrice === 0 ? 'Miễn phí' : `${show.minPrice.toLocaleString('vi-VN')}đ`,
            format: show.format, isWishlisted: show.isWishlisted
          }))
          setRecommendEvents(mapped)
        }
      } catch (err) { console.error('Lỗi API Recommend:', err) }
    }
    fetchRecommend()
  }, [])

  // 3. GỌI API LẤY DATA MẶC ĐỊNH CHO CAROUSEL
  useEffect(() => {
    const fetchDefaultShows = async () => {
      setIsLoading(true)
      try {
        const res = await getShows({ page: 1, pageSize: 50, sortBy: 'Newest', includeSoldOut: true })
        if (res.success) {
          const mapped = res.data.items.map(show => ({
            id: show.id, title: show.name, thumbnail: show.coverImageUrl,
            start_date: show.scheduledStart, province: show.loungeCity,
            genre: show.genres?.[0]?.name || 'Khác', genreId: show.genres?.[0]?.id || null,
            price: show.minPrice === 0 && show.maxPrice === 0 ? 'Miễn phí' : `${show.minPrice.toLocaleString('vi-VN')}đ`,
            format: show.format, isWishlisted: show.isWishlisted
          }))
          setAllEvents(mapped)
        }
      } catch (err) { console.error('Lỗi API mặc định:', err) } 
      finally { setIsLoading(false) }
    }
    fetchDefaultShows()
  }, [])

  const genreSections = useMemo(() => {
    const groups = {}
    allEvents.forEach(ev => {
      if (!groups[ev.genre]) groups[ev.genre] = []
      groups[ev.genre].push(ev)
    })
    return Object.keys(groups).map(genreName => {
      const limitedEvents = groups[genreName].slice(0, 10)
      const genreId = groups[genreName][0]?.genreId
      return {
        genreId: genreId ? String(genreId) : genreName.toLowerCase(),
        genreName: genreName,
        slug: genreId ? `/shows/search?genreId=${genreId}` : `/shows/search?genre=${genreName.toLowerCase()}`, // ⭐ ĐỔI SLUG
        events: limitedEvents
      }
    })
  }, [allEvents])

  // ⭐ KHI BẤM APPLY TRONG MODAL FILTER, CHUYỂN TRANG
  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters)
    setIsFilterOpen(false)
    navigate('/shows/search', { state: { appliedFilters: filters } })
  }

  // ⭐ KHI CHỌN NGÀY XONG, CHUYỂN TRANG
  const handleApplyDates = () => {
    if (startDate || endDate) {
      navigate('/shows/search', { state: { startDate, endDate } })
    }
  }

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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <SectionHeader 
          onOpenFilter={() => setIsFilterOpen(true)} 
          appliedFilters={appliedFilters}
          startDate={startDate} setStartDate={setStartDate} 
          endDate={endDate} setEndDate={setEndDate}
          onApplyDates={handleApplyDates} // ⭐ TRUYỀN PROP MỚI
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16 space-y-8 sm:space-y-12 lg:space-y-16">
        <>
          {trendingEvents.length > 0 && <HeroBanner events={trendingEvents} />}
          {recommendEvents.length > 0 && (
            <section>
              <EventCarousel title="Recommend" events={recommendEvents} />
            </section>
          )}
          {genreSections.map((section) => (
            <section key={section.genreId}>
              <EventCarousel title={`Genre ${section.genreName}`} events={section.events} showViewMore={true} viewMoreLink={section.slug} />
            </section>
          ))}
        </>
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} initialFilters={appliedFilters} onApply={handleApplyFilters} />
    </div>
  )
}

export default HomePage