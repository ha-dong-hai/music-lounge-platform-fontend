// src/components/home/HorizontalTagSlider.jsx
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const HorizontalTagSlider = ({ label, options, selectedItems, onSelect, onRemove }) => {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollPosition = () => {
    const el = scrollRef.current
    if (!el) return

    const { scrollLeft, clientWidth, scrollWidth } = el
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
  }

  useEffect(() => {
    checkScrollPosition()
    window.addEventListener('resize', checkScrollPosition)
    return () => window.removeEventListener('resize', checkScrollPosition)
  }, [options])

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -150 : 150, behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-300">{label}</label>
      
      <div className="relative group/slider">
        
        {/* Left Arrow */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-gray-800 text-white shadow-md border border-gray-600 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Scroll Area */}
        <div 
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="flex gap-2 overflow-x-auto scroll-smooth py-1 px-1 hide-scrollbar"
        >
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.label
            const isSelected = selectedItems.includes(value)
            
            return (
              <button
                key={typeof opt === 'string' ? opt : opt.id}
                onClick={() => isSelected ? onRemove(value) : onSelect(value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-[#C3B665] text-black border-[#C3B665]' 
                    : 'bg-transparent text-gray-300 border-gray-600 hover:border-[#C3B665]/50 hover:text-white'
                }`}
              >
                {value}
              </button>
            )
          })}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-gray-800 text-white shadow-md border border-gray-600 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedItems.map(item => (
            <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#C3B665]/10 rounded-md text-xs font-medium text-[#C3B665] border border-[#C3B665]/30">
              {item}
              <button onClick={() => onRemove(item)} className="hover:text-red-400 ml-0.5"><X size={12}/></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default HorizontalTagSlider