// src/components/home/DateRangeCalendar.jsx
import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DateRangeCalendar = ({ startDate, endDate, setStartDate, setEndDate, onClose }) => {
  // State quản lý tháng đang xem. Mặc định là tháng của startDate (hoặc tháng hiện tại)
  const [currentMonth, setCurrentMonth] = useState(dayjs(startDate || undefined))
  const [hoverDate, setHoverDate] = useState(null)

  const start = startDate ? dayjs(startDate) : null
  const end = endDate ? dayjs(endDate) : null

  // Tính số ngày trong tháng và ngày bắt đầu là thứ mấy
  const daysInMonth = currentMonth.daysInMonth()
  const firstDayOfMonth = currentMonth.startOf('month')
  // Chuyển đổi để tuần bắt đầu bằng Thứ 2 (Monday = 0, Sunday = 6)
  const paddingDays = (firstDayOfMonth.day() + 6) % 7

  // Tạo mảng các ngày để render (bao gồm cả ô trống đầu tháng)
  const daysArray = [
    ...Array(paddingDays).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => firstDayOfMonth.date(i + 1))
  ]

  const handleDayClick = (date) => {
    if (!date) return
    const dateStr = date.format('YYYY-MM-DD')

    // TH1: Chưa có ngày đi, HOẶC đã có đủ cả cặp -> Bắt đầu chọn cặp mới
    if (!start || (start && end)) {
      setStartDate(dateStr)
      setEndDate('')
      setHoverDate(date)
    } 
    // TH2: Đã có ngày đi, đang chọn ngày về
    else {
      if (date.isBefore(start)) {
        // Nếu chọn ngày về trước ngày đi -> Đổi ngày đi thành ngày này
        setStartDate(dateStr)
      } else {
        // Nếu hợp lệ -> Gán ngày về
        setEndDate(dateStr)
        setHoverDate(null)
        // onClose() // Bỏ comment dòng này nếu muốn tự đóng lịch sau khi chọn xong
      }
    }
  }

  const isInRange = (date) => {
    if (!start || !end) return false
    return (date.isAfter(start) && date.isBefore(end))
  }

  const isHoverInRange = (date) => {
    if (!start || end) return false
    if (!hoverDate) return false
    
    // Xử lý hover lùi (kéo chuột từ ngày lớn về ngày nhỏ)
    if (hoverDate.isBefore(start)) {
      return date.isAfter(hoverDate) && date.isBefore(start)
    }
    return date.isAfter(start) && date.isBefore(hoverDate)
  }

  const isStartOrEnd = (date) => {
    return (start && date.isSame(start, 'day')) || (end && date.isSame(end, 'day'))
  }

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  return (
    <div className="bg-[#1a1a1a] border border-[#C3B665]/30 rounded-xl p-4 shadow-2xl w-[320px] select-none">
      {/* Header Tháng/Năm */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))}
          className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-[#C3B665] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-white font-bold text-sm">
          {currentMonth.format('MMMM, YYYY')}
        </h3>
        <button 
          onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))}
          className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-[#C3B665] transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Chữ ngày trong tuần */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Lưới các ngày */}
      <div className="grid grid-cols-7 gap-1">
        {daysArray.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />

          const isStart = start && date.isSame(start, 'day')
          const isEnd = end && date.isSame(end, 'day')
          const inRange = isInRange(date)
          const hoverRange = isHoverInRange(date)
          const isEdge = isStart || isEnd

          return (
            <button
              key={date.toString()}
              onClick={() => handleDayClick(date)}
              onMouseEnter={() => start && !end && setHoverDate(date)}
              className={`
                relative aspect-square flex items-center justify-center text-xs rounded-md transition-colors
                ${isEdge ? 'bg-[#C3B665] text-black font-bold z-10' : 'text-gray-300 hover:bg-white/10'}
                ${(inRange || hoverRange) ? 'bg-[#C3B665]/20 text-white' : ''}
              `}
            >
              {date.format('D')}
            </button>
          )
        })}
      </div>

      {/* Footer nhanh */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
        <button 
          onClick={() => { setStartDate(''); setEndDate(''); setHoverDate(null) }}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          Xóa ngày
        </button>
        <button 
          onClick={onClose}
          className="text-xs bg-[#C3B665] text-black px-3 py-1 rounded-md font-bold hover:bg-[#d4c87f] transition-colors"
        >
          Xong
        </button>
      </div>
    </div>
  )
}

export default DateRangeCalendar