import { useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const HorizontalTagSlider = ({ label, options, selectedItems, onSelect, onRemove }) => {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (scrollRef.current) {
      // Cuộn ngang 150px mỗi lần bấm mũi tên
      scrollRef.current.scrollBy({ left: direction === 'left' ? -150 : 150, behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-900">{label}</label>
      
      {/* Container bọc ngoài dạng relative để chứa nút mũi tên */}
      <div className="relative group/slider">
        
        {/* Nút Mũi tên Trái */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Vùng Cuộn Ngang */}
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth py-1 px-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Ẩn thanh cuộn xấu xí
        >
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.label
            const isSelected = selectedItems.includes(value)
            
            return (
              <button
                key={typeof opt === 'string' ? opt : opt.id}
                onClick={() => isSelected ? onRemove(value) : onSelect(value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                  isSelected 
                    ? 'bg-gray-900 text-white border-gray-900' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {value}
              </button>
            )
          })}
        </div>

        {/* Nút Mũi tên Phải */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Selected Tags */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedItems.map(item => (
            <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-800 border border-gray-200">
              {item}
              <button onClick={() => onRemove(item)} className="hover:text-red-600 ml-0.5"><X size={12}/></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default HorizontalTagSlider