// src/components/shared/SearchableDropdown.jsx
import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

const SearchableDropdown = ({
  label,                   
  options,                 
  selectedItems = [],        
  onAdd,                  
  onRemove,               
  placeholder = "Chọn...", 
  isDisabled = false,      
  multiSelect = false      
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const safeOptions = Array.isArray(options) ? options : []
  const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : []

  const filteredOptions = safeOptions.filter(opt => {
    if (!opt) return false
    
    const value = typeof opt === 'string' 
      ? opt 
      : (opt?.name || opt?.label || opt?.id || '')
    
    return value.toLowerCase().includes((searchTerm || '').toLowerCase()) && 
           !safeSelectedItems.includes(value)
  })

  return (
    <div ref={wrapperRef} className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-300">{label}</label>
      
      <div className="flex gap-2 items-start flex-wrap">
        
        {/* Input + Dropdown */}
        <div className="relative flex-shrink-0 w-full sm:w-auto">
          
          {/* Main Trigger Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                if (!isOpen) setIsOpen(true)
              }}
              onFocus={() => !isDisabled && setIsOpen(true)}
              disabled={isDisabled}
              className={`w-full sm:w-auto min-w-[180px] flex items-center pl-9 pr-9 py-2.5 bg-black/40 text-white border rounded-lg text-sm transition-colors outline-none placeholder:text-gray-500 placeholder:font-medium ${
                isOpen ? 'border-[#C3B665]/50 ring-1 ring-[#C3B665]/30' : 'border-gray-700 hover:border-gray-500'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-900' : 'cursor-text'}`}
            />
            {!isDisabled && (
              <ChevronDown 
                size={16} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              />
            )}
          </div>

          {/* Dropdown List */}
          {isOpen && !isDisabled && (
            <div className="absolute z-50 top-full mt-1 w-full bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <ul className="max-h-48 overflow-y-auto py-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, idx) => {
                    const value = typeof opt === 'string' ? opt : (opt.name || opt.label || opt.id)
                    return (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => {
                            onAdd(value)
                            setSearchTerm('')
                            if (!multiSelect) setIsOpen(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          {value}
                        </button>
                      </li>
                    )
                  })
                ) : (
                  <li className="px-4 py-3 text-center text-sm text-gray-500 italic">
                    Không tìm thấy kết quả
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Selected Items Tags */}
        <div className="flex gap-2 flex-wrap">
          {safeSelectedItems.map((item) => (
            <span 
              key={item}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C3B665]/10 border border-[#C3B665]/30 rounded-md text-sm font-medium text-[#C3B665] animate-in fade-in slide-in-from-bottom-1 duration-200"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="hover:text-red-400 transition-colors p-0.5 hover:bg-red-500/10 rounded"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SearchableDropdown