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

  // ⭐ USEEFFECT XỬ LÝ CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('') // Xóa từ khóa tìm kiếm khi đóng
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Xử lý an toàn: Đảm bảo options là array trước khi filter
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
      <label className="block text-sm font-semibold text-gray-900">{label}</label>
      
      <div className="flex gap-2 items-start flex-wrap">
        {/* Main Trigger Button */}
        <div className="relative flex-shrink-0 min-w-[140px]">
          <button
            onClick={() => !isDisabled && setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-4 py-2.5 bg-card border ${
              isOpen ? 'border-line ring-1 ring-line' : 'border-gray-300'
            } rounded-lg text-left text-sm hover:border-line-strong transition-colors ${
              isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'
            }`}
            disabled={isDisabled}
          >
            <span className={isDisabled ? 'text-ink-soft' : 'text-ink-mute'}>
              {placeholder}
            </span>
            {!isDisabled && <ChevronDown size={16} className="text-ink-mute" />}
          </button>

          {/* Dropdown List with Search */}
          {isOpen && (
            <div className="absolute z-50 top-full mt-1 w-full bg-card border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {/* Search Input inside dropdown */}
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-lg text-on-brand text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>
              
              {/* Options List */}
              <ul className="max-h-48 overflow-y-auto py-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, idx) => {
                    const value = typeof opt === 'string' ? opt : (opt.name || opt.label || opt.id)
                    return (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            onAdd(value)
                            setSearchTerm('')
                            if (!multiSelect) setIsOpen(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-ink-mute hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          {value}
                        </button>
                      </li>
                    )
                  })
                ) : (
                  <li className="px-4 py-3 text-center text-sm text-ink-soft italic">
                    Không có kết quả
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-800 animate-in fade-in slide-in-from-bottom-1 duration-200"
            >
              {item}
              <button
                onClick={() => onRemove(item)}
                className="hover:text-danger transition-colors p-0.5 hover:bg-red-50 rounded"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </span>
          ))}
          
          {safeSelectedItems.length === 0 && (
            <div className="hidden sm:flex px-3 py-1.5 bg-gray-50 border border-dashed border-gray-300 rounded-md text-xs text-transparent select-none">
              Placeholder
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchableDropdown