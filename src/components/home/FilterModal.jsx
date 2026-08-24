// src/components/home/FilterModal.jsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import SearchableDropdown from '../shared/SearchableDropdown'
import HorizontalTagSlider from './HorizontalTagSlider'
import { MOCK_LOCATIONS, MOCK_MUSIC_TYPES, MOCK_LOUNGE_SPACES, MOCK_MOODS } from '../../constants/filterData'

const FilterModal = ({ isOpen, onClose, initialFilters, onApply }) => {
  // ⭐ LOCAL STATE CHỈ TỒN TẠI TRONG MODAL
  const [localFilters, setLocalFilters] = useState(initialFilters)

  // ⭐ MỖI LẦN MỞ MODAL, ĐỒNG BỘ DỮ LIỆU TỪ CHA VÀO
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  if (!isOpen) return null

  // --- Handlers nội bộ (chỉ update local state) ---
  const toggleArrItem = (key, item) => {
    setLocalFilters(prev => {
      const list = prev[key] || []
      return { ...prev, [key]: list.includes(item) ? list.filter(i => i !== item) : [...list, item] }
    })
  }

  const handleAddSpace = (s) => {
    setLocalFilters(prev => {
      let spaces = prev.selectedSpaces || []
      if (s === 'Không gian') return { ...prev, selectedSpaces: ['Không gian'] }
      if (spaces.includes('Không gian')) return { ...prev, selectedSpaces: [s] }
      return { ...prev, selectedSpaces: spaces.includes(s) ? spaces.filter(i => i !== s) : [...spaces, s] }
    })
  }

  const handleAddMood = (m) => {
    setLocalFilters(prev => {
      let moods = prev.selectedMoods || []
      if (m === 'Cảm xúc') return { ...prev, selectedMoods: ['Cảm xúc'] }
      if (moods.includes('Cảm xúc')) return { ...prev, selectedMoods: [m] }
      return { ...prev, selectedMoods: moods.includes(m) ? moods.filter(i => i !== m) : [...moods, m] }
    })
  }

  const handleReset = () => {
    setLocalFilters({
      selectedProvince: null, selectedDistricts: [], selectedWards: [],
      selectedGenres: [], selectedSubGenres: [], selectedSpaces: [], selectedMoods: [],
      minPrice: '', maxPrice: ''
    })
  }

  // ⭐ KHI BẤM ÁP DỤNG MỚI TRẢ DỮ LIỆU VỀ PAGE CHA
  const handleApplyClick = () => {
    onApply(localFilters)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-3xl h-[90vh] max-h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
        
        <div className="flex-none w-full flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Bộ lọc</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-0 overscroll-contain">
          
          <section className="space-y-4 relative">
            <SearchableDropdown
              label="Tỉnh thành"
              options={MOCK_LOCATIONS.provinces}
              selectedItems={localFilters.selectedProvince ? [localFilters.selectedProvince] : []}
              onAdd={(val) => setLocalFilters(prev => ({ ...prev, selectedProvince: val }))}
              onRemove={() => setLocalFilters(prev => ({ ...prev, selectedProvince: null }))}
              placeholder="Tỉnh thành"
              multiSelect={false}
            />
            <SearchableDropdown
              label="Phường"
              options={MOCK_LOCATIONS.wards.q1 || []}
              selectedItems={localFilters.selectedWards}
              onAdd={(val) => toggleArrItem('selectedWards', val)}
              onRemove={(val) => toggleArrItem('selectedWards', val)}
              placeholder="Phường"
              isDisabled={!localFilters.selectedProvince}
              multiSelect={true}
            />
            <SearchableDropdown
              label="Quận"
              options={MOCK_LOCATIONS.districts.hcm || []}
              selectedItems={localFilters.selectedDistricts}
              onAdd={(val) => toggleArrItem('selectedDistricts', val)}
              onRemove={(val) => toggleArrItem('selectedDistricts', val)}
              placeholder="Quận"
              isDisabled={!localFilters.selectedProvince}
              multiSelect={true}
            />
          </section>

          <hr className="border-gray-200"/>

          <section className="space-y-6">
            <h3 className="font-bold text-lg text-gray-900">Nhạc</h3>
            <HorizontalTagSlider
              label="Thể loại"
              options={MOCK_MUSIC_TYPES}
              selectedItems={localFilters.selectedGenres}
              onSelect={(val) => toggleArrItem('selectedGenres', val)}
              onRemove={(val) => toggleArrItem('selectedGenres', val)}
            />
            <HorizontalTagSlider
              label="Dòng nhạc"
              options={['Ballad', 'Bolero', 'Remix', 'Underground', 'Chill step', 'Latin']}
              selectedItems={localFilters.selectedSubGenres}
              onSelect={(val) => toggleArrItem('selectedSubGenres', val)}
              onRemove={(val) => toggleArrItem('selectedSubGenres', val)}
            />
          </section>

          <hr className="border-gray-200"/>

          <section className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Khoảng giá</h3>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">đ</span>
                <input 
                  type="number"
                  placeholder="Từ"
                  value={localFilters.minPrice}
                  onChange={e => setLocalFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-gray-400 font-light">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">đ</span>
                <input 
                  type="number"
                  placeholder="Đến"
                  value={localFilters.maxPrice}
                  onChange={e => setLocalFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                {MOCK_LOUNGE_SPACES.map((space) => {
                  const isSelected = localFilters.selectedSpaces.includes(space.label)
                  return (
                    <button
                      key={space.id}
                      onClick={() => handleAddSpace(space.label)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        isSelected ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 active:bg-gray-50'
                      }`}
                    >
                      {space.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-sm font-semibold text-gray-900">Cảm xúc</label>
              <div className="flex flex-wrap gap-2">
                {MOCK_MOODS.map((mood) => {
                  const isSelected = localFilters.selectedMoods.includes(mood.label)
                  return (
                    <button
                      key={mood.id}
                      onClick={() => handleAddMood(mood.label)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        isSelected ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 active:bg-gray-50'
                      }`}
                    >
                      {mood.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
          <div className="h-4"></div>
        </div>

        <div className="flex-none w-full bg-white border-t border-gray-100 p-6 grid grid-cols-2 gap-4 z-10">
          <button
            onClick={handleReset}
            className="py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Thiết lập lại
          </button>
          <button
            onClick={handleApplyClick}
            className="py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors shadow-lg cursor-pointer"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterModal