// src/components/home/FilterModal.jsx
//
// GHI CHÚ: ô lọc "Quận/Huyện" đã được BỎ HẲN, không phải tạm tắt. Ba lý do:
// backend không có endpoint danh sách quận (/lounge-shows/filter-options chỉ trả genres,
// moods, atmospheres, cities); cột quận của mọi phòng trà trên hệ thống đang rỗng; và từ
// 01/07/2025 Việt Nam bỏ cấp huyện nên "quận" không còn là đơn vị hành chính. Đừng dựng lại.
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import SearchableDropdown from '../shared/SearchableDropdown'
import HorizontalTagSlider from './HorizontalTagSlider'
import { getFilterOptions } from '../../services/showServices'

const baseButtonClasses = "px-4 py-2 rounded-lg border text-sm font-medium transition-all"
const activeBtnClasses = "bg-card text-ink border-line"
const inactiveBtnClasses = "bg-card text-ink-mute border-gray-300 hover:border-line-strong active:bg-gray-50"

const FilterModal = ({ isOpen, onClose, initialFilters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(initialFilters)
  
  // ⭐ STATE CHỨA DATA TỪ BE
  const [options, setOptions] = useState({ genres: [], moods: [], atmospheres: [], cities: [] })

  // ⭐ GỌI API LẤY FILTER OPTIONS LẦN ĐẦU
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getFilterOptions()
        if (res.success) {
          setOptions(res.data)
        }
      } catch (err) {
        console.error('Error loading filter options:', err)
      }
    }
    fetchOptions()
  }, [])

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  if (!isOpen) return null

  const toggleArrItem = (key, item) => {
    setLocalFilters(prev => {
      const list = prev[key] || []
      return { ...prev, [key]: list.includes(item) ? list.filter(i => i !== item) : [...list, item] }
    })
  }

  const handleAddSpace = (s) => {
    setLocalFilters(prev => {
      let spaces = prev.selectedSpaces || []
      return { ...prev, selectedSpaces: spaces.includes(s) ? spaces.filter(i => i !== s) : [...spaces, s] }
    })
  }

  const handleAddMood = (m) => {
    setLocalFilters(prev => {
      let moods = prev.selectedMoods || []
      return { ...prev, selectedMoods: moods.includes(m) ? moods.filter(i => i !== m) : [...moods, m] }
    })
  }

  const handleReset = () => {
    setLocalFilters({
      selectedProvince: null,
      selectedGenres: [], selectedSpaces: [], selectedMoods: [],
      minPrice: '', maxPrice: ''
    })
  }

  const handleApplyClick = () => {
    onApply(localFilters)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-card w-full max-w-3xl h-[90vh] max-h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
        
        <div className="flex-none w-full flex items-center justify-between p-6 border-b border-gray-100 bg-card z-10">
          <h2 className="text-xl font-bold text-gray-900">Bộ lọc</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 text-ink-mute rounded-full transition-colors">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-0 overscroll-contain">
          
          <section className="space-y-4 relative">
            <SearchableDropdown
              label="Thành phố"
              options={options.cities}
              selectedItems={localFilters.selectedProvince ? [localFilters.selectedProvince] : []}
              onAdd={(val) => setLocalFilters(prev => ({ ...prev, selectedProvince: val }))}
              onRemove={() => setLocalFilters(prev => ({ ...prev, selectedProvince: null }))}
              placeholder="Thành phố"
              multiSelect={false}
            />
          </section>

          <hr className="border-gray-200"/>

          <section className="space-y-6">
            <h3 className="font-bold text-lg text-gray-900">Âm nhạc</h3>
            <HorizontalTagSlider
              label="Thể loại"
              options={options.genres}
              selectedItems={localFilters.selectedGenres}
              onSelect={(val) => toggleArrItem('selectedGenres', val)}
              onRemove={(val) => toggleArrItem('selectedGenres', val)}
            />
          </section>

          <hr className="border-gray-200"/>

          <section className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Mức giá</h3>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft text-sm font-medium">đ</span>
                <input 
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Từ"
                  value={localFilters.minPrice}
                  onChange={e => setLocalFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-on-brand focus:outline-none focus:ring-2 focus:ring-line focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-ink-soft font-light">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft text-sm font-medium">đ</span>
                <input 
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Đến"
                  value={localFilters.maxPrice}
                  onChange={e => setLocalFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-on-brand focus:outline-none focus:ring-2 focus:ring-line focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-200"/>

          <section className="space-y-5">
            <h3 className="font-bold text-lg text-gray-900">Phòng trà</h3>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Không gian</label>
              <div className="flex flex-wrap gap-2">
                {options.atmospheres.map((space) => {
                  const isSelected = localFilters.selectedSpaces.includes(space.name)
                  return (
                    <button
                      key={space.id}
                      onClick={() => handleAddSpace(space.name)}
                      className={`${baseButtonClasses} ${isSelected ? activeBtnClasses : inactiveBtnClasses}`}
                    >
                      {space.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-sm font-semibold text-gray-900">Tâm trạng</label>
              <div className="flex flex-wrap gap-2">
                {options.moods.map((mood) => {
                  const isSelected = localFilters.selectedMoods.includes(mood.name)
                  return (
                    <button
                      key={mood.id}
                      onClick={() => handleAddMood(mood.name)}
                      className={`${baseButtonClasses} ${isSelected ? activeBtnClasses : inactiveBtnClasses}`}
                    >
                      {mood.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
          <div className="h-4"></div>
        </div>

        <div className="flex-none w-full bg-card border-t border-gray-100 p-6 grid grid-cols-2 gap-4 z-10">
          <button
            onClick={handleReset}
            className="py-3 rounded-xl border border-gray-300 text-ink-mute font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Đặt lại
          </button>
          <button
            onClick={handleApplyClick}
            className="py-3 rounded-xl bg-card text-ink font-semibold hover:bg-sunken transition-colors shadow-lg cursor-pointer"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterModal