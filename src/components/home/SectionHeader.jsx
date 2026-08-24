import { useRef } from 'react'
import { Filter, CalendarDays, ChevronDown, X } from 'lucide-react'

const SectionHeader = ({ onOpenFilter, startDate, setStartDate, endDate, setEndDate }) => {
  // Tạo ref để điều khiển input date bằng code
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const handleClearDates = (e) => {
    e.stopPropagation();
    setStartDate('');
    setEndDate('');
  }

  const isDateActive = startDate || endDate;

  // Hàm định dạng ngày cho đẹp (VD: 24/10/23)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  // Hàm gọi lịch chọn ngày của trình duyệt bằng code
  const openDatePicker = (ref) => {
    if (ref.current && typeof ref.current.showPicker === 'function') {
      ref.current.showPicker();
    } else if (ref.current) {
      ref.current.focus(); // Dự phòng cho các trình duyệt cũ không hỗ trợ showPicker
    }
  };

  return (
    <div className="flex items-center justify-end mb-6 px-1 gap-3">
      
      {/* Nút Bộ lọc */}
      <button 
        onClick={onOpenFilter} 
        className="flex items-center gap-2 px-5 py-2.5 font-medium border border-[#C3B665] rounded-full text-sm text-[#C3B665] hover:bg-[#C3B665]/50 hover:font-bold hover:text-black transition-all shadow-sm"
      >
        <Filter size={16}/> 
        Filter
        <ChevronDown size={14} className="ml-1"/>
      </button>

      {/* Khoảng thời gian (Date Range) */}
      <div className="flex items-center bg-[#1a1a1a] border border-[#C3B665]/30 rounded-full shadow-sm hover:border-[#C3B665] transition-all overflow-hidden">
        
        {/* Ngày bắt đầu */}
        <div 
          className="relative flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => openDatePicker(startDateRef)}
        >
          <CalendarDays size={16} className="text-[#C3B665] flex-shrink-0"/>
          
          {/* Chữ hiển thị: click vào sẽ gọi openDatePicker */}
          <span className={`text-sm font-medium whitespace-nowrap ${startDate ? 'text-white' : 'text-gray-400'}`}>
            {startDate ? formatDate(startDate) : 'From'}
          </span>
          
          {/* Input bị ẩn hoàn toàn khỏi giao diện nhưng vẫn hoạt động */}
          <input 
            ref={startDateRef}
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="sr-only [color-scheme:dark]" 
            tabIndex={-1} // Loại bỏ focus bằng phím Tab vì đã có logic click thay thế
          />
        </div>

        {/* Dấu phân cách */}
        <div className="h-5 w-px bg-[#C3B665]/20"></div>

        {/* Ngày kết thúc */}
        <div 
          className="relative flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => openDatePicker(endDateRef)}
        >
          <span className={`text-sm font-medium whitespace-nowrap ${endDate ? 'text-white' : 'text-gray-400'}`}>
            {endDate ? formatDate(endDate) : 'To'}
          </span>
          
          <input 
            ref={endDateRef}
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="sr-only [color-scheme:dark]"
            tabIndex={-1}
          />
        </div>

        {/* Nút Xóa nhanh ngày đã chọn */}
        {isDateActive && (
          <button 
            onClick={handleClearDates} 
            className="ml-1 mr-2 text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/5"
            title="Remove date"
          >
            <X size={16}/>
          </button>
        )}
      </div>

    </div>
  )
}

export default SectionHeader