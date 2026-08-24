// src/components/home/SectionHeader.jsx
import { useState, useRef, useEffect } from 'react'
import { Filter, CalendarDays, ChevronDown, X } from 'lucide-react'
import dayjs from 'dayjs'
import DateRangeCalendar from './DateRangeCalendar'

const SectionHeader = ({ onOpenFilter, appliedFilters = {}, startDate, setStartDate, endDate, setEndDate }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const calendarRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setIsCalendarOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isDateActive = startDate || endDate
  
  // Dùng optional chaining (?.) để tránh lỗi nếu appliedFilters hoặc các thuộc tính con bị undefined
  const isFilterActive = appliedFilters?.selectedProvince || 
                         (appliedFilters?.selectedGenres?.length > 0) || 
                         appliedFilters?.minPrice || 
                         appliedFilters?.maxPrice

  const getLabel = () => {
    if (startDate && endDate) return `${dayjs(startDate).format('DD/MM')} → ${dayjs(endDate).format('DD/MM')}`
    if (startDate) return `Từ ${dayjs(startDate).format('DD/MM')}`
    if (endDate) return `Đến ${dayjs(endDate).format('DD/MM')}`
    return 'Date'
  }

  const handleClearDates = (e) => {
    e.stopPropagation()
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="flex items-center justify-end mb-6 px-1 gap-3">
      
      <button 
        onClick={onOpenFilter} 
        className={`flex items-center gap-2 px-5 py-2.5 font-medium border rounded-full text-sm transition-all shadow-sm ${
          isFilterActive 
            ? 'bg-[#C3B665]/10 border-[#C3B665] text-[#C3B665]' 
            : 'border-[#C3B665] text-[#C3B665] hover:bg-[#C3B665]/50 hover:font-bold hover:text-black'
        }`}
      >
        <Filter size={16}/> 
        Filter
        <ChevronDown size={14} className="ml-1"/>
      </button>

      <div className="relative" ref={calendarRef}>
        <button 
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm transition-all ${
            isDateActive 
              ? 'bg-[#C3B665]/10 border-[#C3B665] text-[#C3B665]' 
              : 'bg-[#1a1a1a] border-[#C3B665]/30 text-gray-400 hover:border-[#C3B665]'
          }`}
        >
          <CalendarDays size={16} className="flex-shrink-0"/>
          <span className="text-sm font-medium whitespace-nowrap">{getLabel()}</span>
          {isDateActive && (
            <span onClick={handleClearDates} className="ml-1 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-white/5" title="Remove date">
              <X size={14}/>
            </span>
          )}
        </button>

        {isCalendarOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <DateRangeCalendar
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              onClose={() => setIsCalendarOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default SectionHeader