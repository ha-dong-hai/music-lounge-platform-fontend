import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Component con để render từng tháng
const MonthGrid = ({ monthDate, startDate, endDate, hoverDate, onDayClick, onDayHover }) => {
  const daysInMonth = monthDate.daysInMonth()
  const firstDayOfMonth = monthDate.startOf('month')
  const paddingDays = (firstDayOfMonth.day() + 6) % 7

  const daysArray = [
    ...Array(paddingDays).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => firstDayOfMonth.date(i + 1))
  ]

  const start = startDate ? dayjs(startDate) : null
  const end = endDate ? dayjs(endDate) : null

  const isInRange = (date) => {
    if (!start || !end) return false
    return (date.isAfter(start) && date.isBefore(end))
  }

  const isHoverInRange = (date) => {
    if (!start || end) return false
    if (!hoverDate) return false
    if (hoverDate.isBefore(start)) {
      return date.isAfter(hoverDate) && date.isBefore(start)
    }
    return date.isAfter(start) && date.isBefore(hoverDate)
  }

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  return (
    <div className="flex-1 min-w-[240px]">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
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
              onClick={() => onDayClick(date)}
              onMouseEnter={() => start && !end && onDayHover(date)}
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
    </div>
  )
}

const DateRangeCalendar = ({ startDate, endDate, setStartDate, setEndDate, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs(startDate || undefined))
  const [hoverDate, setHoverDate] = useState(null)
  
  // Tạo state tạm thời từ dữ liệu ban đầu truyền vào
  const [tempStart, setTempStart] = useState(startDate || '')
  const [tempEnd, setTempEnd] = useState(endDate || '')

  // Chỉ cập nhật state tạm thời
  const handleDayClick = (date) => {
    if (!date) return
    const dateStr = date.format('YYYY-MM-DD')
    const start = tempStart ? dayjs(tempStart) : null
    const end = tempEnd ? dayjs(tempEnd) : null

    if (!start || (start && end)) {
      setTempStart(dateStr)
      setTempEnd('')
      setHoverDate(date)
    } else {
      if (date.isBefore(start)) {
        setTempStart(dateStr)
      } else {
        setTempEnd(dateStr)
        setHoverDate(null)
      }
    }
  }

  const handleDayHover = (date) => {
    setHoverDate(date)
  }

  // Khi bấm Accept mới đẩy dữ liệu tạm thời lên component cha
  const handleAccept = () => {
    setStartDate(tempStart)
    setEndDate(tempEnd)
    onClose()
  }

  // Khi bấm Remove chỉ xóa dữ liệu tạm thời
  const handleRemove = () => {
    setTempStart('')
    setTempEnd('')
    setHoverDate(null)
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#C3B665]/30 rounded-xl p-4 shadow-2xl w-auto max-w-[560px] select-none">
      {/* Header Tháng/Năm */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))}
          className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-[#C3B665] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-8 flex-1 justify-center">
          <h3 className="text-white font-bold text-sm w-[140px] text-center">
            {currentMonth.format('MMMM, YYYY')}
          </h3>
          <h3 className="text-white font-bold text-sm w-[140px] text-center">
            {currentMonth.add(1, 'month').format('MMMM, YYYY')}
          </h3>
        </div>
        <button 
          onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))}
          className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-[#C3B665] transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Hiển thị 2 tháng cạnh nhau - Truyền state tạm thời vào đây */}
      <div className="flex gap-8">
        <MonthGrid 
          monthDate={currentMonth} 
          startDate={tempStart} 
          endDate={tempEnd} 
          hoverDate={hoverDate}
          onDayClick={handleDayClick}
          onDayHover={handleDayHover}
        />
        <MonthGrid 
          monthDate={currentMonth.add(1, 'month')} 
          startDate={tempStart} 
          endDate={tempEnd} 
          hoverDate={hoverDate}
          onDayClick={handleDayClick}
          onDayHover={handleDayHover}
        />
      </div>

      {/* Footer nhanh */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
        <button 
          onClick={handleRemove}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          Remove date
        </button>
        <button 
          onClick={handleAccept}
          className="text-xs bg-[#C3B665] text-black px-3 py-1 rounded-md font-bold hover:bg-[#d4c87f] transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  )
}

export default DateRangeCalendar