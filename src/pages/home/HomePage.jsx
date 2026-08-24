// src/pages/home/HomePage.jsx
import { useState } from 'react'
import { X, CalendarDays } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import ShowCarousel from '../../components/home/ShowCarousel'
import ShowCard from '../../components/home/ShowCard'
import SectionHeader from '../../components/home/SectionHeader'
import FilterModal from '../../components/home/FilterModal'
import { HOME_DATA } from '../../constants/mockData'
import dayjs from 'dayjs'
import Skeleton from '../../components/shared/Skeleton'



const initialFilterState = {
  selectedProvince: null,
  selectedDistricts: [],
  selectedWards: [],
  selectedGenres: [],
  selectedSubGenres: [],
  selectedSpaces: [],
  selectedMoods: [],
  minPrice: '',
  maxPrice: '',
}

const HomePage = () => {
  const { searchQuery = '' } = useOutletContext() || {}

   const isLoading = false // Tạm bật True để xem demo

   if (isLoading) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 pt-6 max-w-[1600px] mx-auto">
        {/* Khung Header giả lập */}
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>

        {/* Khung Carousel giả lập */}
        <div className="mb-12">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                {/* Giả lập ảnh Thumbnail */}
                <Skeleton className="w-full aspect-video rounded-xl" />
                {/* Giả lập Tiêu đề */}
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [appliedFilters, setAppliedFilters] = useState(initialFilterState)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const removeFromFilterArray = (key, item) => {
    setAppliedFilters(prev => ({ ...prev, [key]: prev[key].filter(i => i !== item) }))
  }

  const resetFilters = () => {
    setAppliedFilters(initialFilterState)
    setStartDate('')
    setEndDate('')
  }

  const applyFilters = () => setIsFilterOpen(false)

  const allEvents = [
    ...HOME_DATA.featured,
    ...HOME_DATA.genreSections.flatMap(g => g.events),
    ...HOME_DATA.moodSections.flatMap(m => m.events)
  ].reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) acc.push(current);
    return acc;
  }, []);

  const searchResults = searchQuery.trim() === ''
    ? allEvents
    : allEvents.filter(ev => ev.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const finalFilteredEvents = searchResults.filter(ev => {
    const f = appliedFilters
    if (f.selectedProvince && ev.province !== f.selectedProvince) return false
    if (f.selectedGenres.length > 0 && !f.selectedGenres.includes(ev.genre)) return false
    if (f.selectedSubGenres.length > 0 && !f.selectedSubGenres.includes(ev.subGenre)) return false
    if (f.selectedMoods.length > 0 && !f.selectedMoods.includes(ev.mood)) return false
    if (f.selectedSpaces.length > 0 && !f.selectedSpaces.includes(ev.space)) return false

    if (f.minPrice || f.maxPrice) {
      const eventPrice = ev.priceValue || 0
      if (f.minPrice && eventPrice < Number(f.minPrice)) return false
      if (f.maxPrice && eventPrice > Number(f.maxPrice)) return false
    }

    if (startDate || endDate) {
      const eventDateStr = dayjs(ev.start_date).format('YYYY-MM-DD')
      if (startDate && eventDateStr < startDate) return false
      if (endDate && eventDateStr > endDate) return false
    }

    return true
  })

  const isSearching = searchQuery.trim() !== ''
  const isFiltering = Object.values(appliedFilters).some(val => Array.isArray(val) ? val.length > 0 : val !== null && val !== '') || startDate || endDate
  const isActiveMode = isSearching || isFiltering

  const RemovableTag = ({ label, onRemove, icon: Icon }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-800 rounded-full text-xs font-medium text-gray-200 border border-gray-700 whitespace-nowrap">
      {Icon && <Icon size={12} className="text-[#C3B665] flex-shrink-0" />}
      <span className="truncate max-w-[120px] sm:max-w-none">{label}</span>
      <button onClick={onRemove} className="hover:text-red-400 ml-0.5 flex-shrink-0"><X size={12} /></button>
    </span>
  )

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">

        <SectionHeader
          onOpenFilter={() => setIsFilterOpen(true)}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {isFiltering && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center pb-3 sm:pb-4">
            {appliedFilters.selectedProvince && (
              <RemovableTag label={appliedFilters.selectedProvince} onRemove={() => setAppliedFilters(prev => ({ ...prev, selectedProvince: null }))} />
            )}
            {appliedFilters.selectedGenres.map(g => (
              <RemovableTag key={g} label={g} onRemove={() => removeFromFilterArray('selectedGenres', g)} />
            ))}
            {appliedFilters.selectedSubGenres.map(sg => (
              <RemovableTag key={sg} label={sg} onRemove={() => removeFromFilterArray('selectedSubGenres', sg)} />
            ))}
            {appliedFilters.selectedMoods.map(m => (
              <RemovableTag key={m} label={m} onRemove={() => removeFromFilterArray('selectedMoods', m)} />
            ))}
            {appliedFilters.selectedSpaces.map(s => (
              <RemovableTag key={s} label={s} onRemove={() => removeFromFilterArray('selectedSpaces', s)} />
            ))}
            {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
              <RemovableTag
                label={
                  appliedFilters.minPrice && appliedFilters.maxPrice
                    ? `${Number(appliedFilters.minPrice).toLocaleString('vi-VN')}đ - ${Number(appliedFilters.maxPrice).toLocaleString('vi-VN')}đ`
                    : appliedFilters.minPrice
                      ? `Từ ${Number(appliedFilters.minPrice).toLocaleString('vi-VN')}đ`
                      : `Đến ${Number(appliedFilters.maxPrice).toLocaleString('vi-VN')}đ`
                }
                onRemove={() => setAppliedFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))}
              />
            )}
            {(startDate || endDate) && (
              <RemovableTag
                icon={CalendarDays}
                label={startDate && endDate ? `${startDate} → ${endDate}` : startDate ? `Từ ${startDate}` : `Đến ${endDate}`}
                onRemove={() => { setStartDate(''); setEndDate('') }}
              />
            )}
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16 space-y-8 sm:space-y-12 lg:space-y-16">

        {isActiveMode && (
          <section>
            <div className="mb-4 sm:mb-6 px-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-300">
                {isSearching ? `Kết quả tìm kiếm cho "${searchQuery}"` : `Kết quả lọc (${finalFilteredEvents.length})`}
              </h2>
            </div>

            {finalFilteredEvents.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-3 sm:gap-x-5 md:gap-x-6 gap-y-6 sm:gap-y-8">
                {finalFilteredEvents.map((ev) => (
                  <ShowCard key={ev.id} {...ev} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-20">
                <p className="text-lg sm:text-xl font-semibold text-white mb-2">No results found.</p>
                <p className="text-sm text-gray-400">Try changing your search or filters.</p>
              </div>
            )}
          </section>
        )}

        {!isActiveMode && (
          <>
            <section>
              <ShowCarousel title="Recommend" events={HOME_DATA.featured} />
            </section>

            {HOME_DATA.genreSections.map((section) => (
              <section key={section.genreId}>
                <ShowCarousel
                  title={`Genre ${section.genreName}`}
                  events={section.events}
                  showViewMore={true}
                  viewMoreLink={section.slug}
                />
              </section>
            ))}

            {HOME_DATA.moodSections.map((section) => (
              <section key={section.moodId}>
                <ShowCarousel
                  title={`Cảm xúc ${section.moodName}`}
                  events={section.events}
                  showViewMore={true}
                  viewMoreLink={section.slug}
                />
              </section>
            ))}
          </>
        )}

      </div>

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initialFilters={appliedFilters}
        onApply={setAppliedFilters}
      />
    </div>
  )
}

export default HomePage