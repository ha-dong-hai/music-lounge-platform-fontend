// src/components/home/SectionHeader.jsx
import { useState, useRef, useEffect } from 'react'
import { Filter, CalendarDays, ChevronDown, X } from 'lucide-react'
import DateRangeCalendar from './DateRangeCalendar'
import dayjs from 'dayjs'

const SectionHeader = ({ onOpenFilter, startDate, setStartDate, endDate, setEndDate }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const calendarRef = useRef(null)

  // Logic đóng calendar khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setIsCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isDateActive = startDate || endDate

  // Định dạng hiển thị trên nút bấm
  const getLabel = () => {
    if (startDate && endDate) {
      return `${dayjs(startDate).format('DD/MM')} → ${dayjs(endDate).format('DD/MM')}`
    }
    if (startDate) return `Từ ${dayjs(startDate).format('DD/MM')}`
    if (endDate) return `Đến ${dayjs(endDate).format('DD/MM')}`
    return 'Chọn ngày'
  }

  const handleClearDates = (e) => {
    e.stopPropagation()
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="flex items-center justify-end mb-6 px-1 gap-3">
      
      {/* Nút Bộ lọc (Giữ nguyên) */}
      <button 
        onClick={onOpenFilter} 
        className="flex items-center gap-2 px-5 py-2.5 font-medium border border-[#C3B665] rounded-full text-sm text-[#C3B665] hover:bg-[#C3B665]/50 hover:font-bold hover:text-black transition-all shadow-sm"
      >
        <Filter size={16}/> 
        Filter
        <ChevronDown size={14} className="ml-1"/>
      </button>

      {/* ⭐ KHU VỰC DATE RANGE MỚI ⭐ */}
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
          <span className="text-sm font-medium whitespace-nowrap">
            {getLabel()}
          </span>
          
          {isDateActive && (
            <span 
              onClick={handleClearDates} 
              className="ml-1 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-white/5"
              title="Xóa ngày"
            >
              <X size={14}/>
            </span>
          )}
        </button>

        {/* Render Calendar Popover */}
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