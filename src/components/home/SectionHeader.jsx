import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, CalendarDays, X } from 'lucide-react'
import dayjs from 'dayjs'
import DateRangeCalendar from './DateRangeCalendar'

// Đếm số nhóm lọc đang bật (giá tính là một nhóm dù có một hay cả hai đầu).
const demBoLoc = (f = {}) =>
  (f.selectedProvince ? 1 : 0) +
  (f.selectedGenres?.length || 0) +
  (f.selectedSpaces?.length || 0) +
  (f.selectedMoods?.length || 0) +
  (f.minPrice || f.maxPrice ? 1 : 0)

const SectionHeader = ({ onOpenFilter, appliedFilters = {}, startDate, setStartDate, endDate, setEndDate, onApplyDates }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const calendarRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setIsCalendarOpen(false)
    }
    const handleEscape = (e) => { if (e.key === 'Escape') setIsCalendarOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const isDateActive = Boolean(startDate || endDate)
  const soBoLoc = demBoLoc(appliedFilters)
  const isFilterActive = soBoLoc > 0

  const getLabel = () => {
    if (startDate && endDate) return `${dayjs(startDate).format('DD/MM')} → ${dayjs(endDate).format('DD/MM')}`
    if (startDate) return `Từ ${dayjs(startDate).format('DD/MM')}`
    if (endDate) return `Đến ${dayjs(endDate).format('DD/MM')}`
    return 'Chọn ngày'
  }

  const handleClearDates = () => {
    setStartDate('')
    setEndDate('')
  }

  // ⭐ HÀM DUY NHẤT XỬ LÝ BẤM "XONG" - NHẬN GIÁ TRỊ TRỰC TIẾP QUA THAM SỐ
  const handleCalendarConfirm = (start, end) => {
    setIsCalendarOpen(false)   // Đóng lịch
    setStartDate(start)        // Lưu state để nút hiển thị đúng label
    setEndDate(end)
    if (onApplyDates) onApplyDates(start, end) // Điều hướng/tìm kiếm ngay
  }

  const pill = (active) => `border shadow-sm transition-colors ${active ? 'bg-brand/10 border-brand text-brand-text' : 'bg-card border-line-strong text-ink-soft hover:border-brand hover:text-ink'}`

  return (
    <div className="flex flex-wrap items-center justify-start sm:justify-end mb-6 px-1 gap-3">
      <button
        onClick={onOpenFilter}
        aria-label={isFilterActive ? `Bộ lọc, đang bật ${soBoLoc}` : 'Bộ lọc'}
        className={`flex items-center gap-2 px-5 min-h-[44px] font-medium rounded-full text-sm ${pill(isFilterActive)}`}
      >
        <SlidersHorizontal size={16} /> Bộ lọc
        {isFilterActive && (
          <span aria-hidden="true" className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-brand-text text-card text-xs font-bold tabular-nums">
            {soBoLoc}
          </span>
        )}
      </button>

      <div className="relative" ref={calendarRef}>
        <div className={`flex items-center rounded-full ${pill(isDateActive)}`}>
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            aria-expanded={isCalendarOpen}
            aria-haspopup="dialog"
            className={`flex items-center gap-2 min-h-[44px] pl-4 ${isDateActive ? 'pr-2' : 'pr-4'} rounded-full`}
          >
            <CalendarDays size={16} className="flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">{getLabel()}</span>
          </button>
          {isDateActive && (
            <button
              onClick={handleClearDates}
              aria-label="Xoá khoảng ngày"
              title="Xoá khoảng ngày"
              className="w-11 h-11 -ml-1 mr-0.5 inline-flex items-center justify-center rounded-full hover:text-danger hover:bg-sunken transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {isCalendarOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <DateRangeCalendar
              initialStartDate={startDate}
              initialEndDate={endDate}
              onConfirm={handleCalendarConfirm}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default SectionHeader