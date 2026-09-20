// src/pages/admin/AdminFilterOptionsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — BỐN TAB NHƯNG HAI NGUỒN DỮ LIỆU KHÁC NHAU:
//   genres / moods / atmospheres  →  GET /shows/filter-options (một lần trả gộp cả ba)
//   eventCategories               →  GET /catalog/event-categories (endpoint RIÊNG)
// Đừng cố nhồi loại buổi diễn vào filter-options: backend không trả nó ở đó.
//
// Loại buổi diễn còn khác ở ba điểm nữa, xem thêm ghi chú trong OptionFormModal:
//   - có trường `description`, nhưng danh sách CHỈ trả id + name → vào sửa là mô tả cũ bị ghi rỗng
//   - có `isActive`, và danh sách CHỈ trả mục đang bật → tắt đi là không còn đường bật lại trên giao diện
//   - PUT là ghi đè toàn bộ, thiếu trường nào là xoá trường đó
import { useState, useEffect, useCallback } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { getFilterOptions } from '../../services/showServices' //  TÁI DÙNG service sẵn có
import { getEventCategories } from '../../services/catalogServices'
import OptionTypeTab from '../../components/admin/filter-options/OptionTypeTab'

// Cấu hình 4 tab — genres có nameEn, eventCategories có description, 2 loại kia chỉ có name.
// `typeKey` phải trùng khoá trong FILTER_OPTION_TYPES ở adminServices.js.
const TABS = [
  { key: 'genres',          label: 'Genres',          typeLabel: 'Genre',          hasNameEn: true },
  { key: 'moods',           label: 'Moods',           typeLabel: 'Mood',           hasNameEn: false },
  { key: 'atmospheres',     label: 'Atmospheres',     typeLabel: 'Atmosphere',     hasNameEn: false },
  { key: 'eventCategories', label: 'Loại buổi diễn',  typeLabel: 'Loại buổi diễn', hasNameEn: false, hasDescription: true },
]

const AdminFilterOptionsPage = () => {
  const [activeTab, setActiveTab] = useState('genres')
  const [options, setOptions] = useState({ genres: [], moods: [], atmospheres: [], cities: [], eventCategories: [] })
  const [isLoading, setIsLoading] = useState(true)

  // HAI NGUỒN, GỌI SONG SONG VÀ ĐỘC LẬP: một cái lỗi chỉ làm trống tab của nó, không trắng cả trang.
  const fetchOptions = useCallback(async () => {
    setIsLoading(true)
    const [loc, loai] = await Promise.allSettled([getFilterOptions(), getEventCategories()])

    if (loc.status === 'fulfilled' && loc.value?.success) {
      const d = loc.value.data || {}
      setOptions((prev) => ({
        ...prev,
        genres: d.genres || [],
        moods: d.moods || [],
        atmospheres: d.atmospheres || [],
        cities: d.cities || [],
      }))
    } else {
      toast.error('Failed to load filter options')
    }

    if (loai.status === 'fulfilled' && loai.value?.success) {
      setOptions((prev) => ({ ...prev, eventCategories: loai.value.data || [] }))
    } else {
      toast.error('Không tải được danh sách loại buổi diễn.')
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    const chay = async () => { await fetchOptions() }
    chay()
  }, [fetchOptions])

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <SlidersHorizontal size={28} className="text-[#C3B665]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Filter Options</h1>
          <p className="text-gray-400 text-sm">
            Manage genres, moods, atmospheres and event categories used in show filters across the platform.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-6 border-b border-gray-800">
        <div className="flex flex-wrap gap-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-4 text-base font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#C3B665] text-[#C3B665]'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs font-medium ${activeTab === tab.key ? 'text-[#C3B665]' : 'text-gray-600'}`}>
                {options[tab.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* NỘI DUNG TAB */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#C3B665]" />
        </div>
      ) : (
        TABS.filter(tab => tab.key === activeTab).map(tab => (
          <OptionTypeTab
            key={tab.key}
            typeKey={tab.key}
            typeLabel={tab.typeLabel}
            hasNameEn={tab.hasNameEn}
            hasDescription={tab.hasDescription}
            options={options[tab.key]}
            onRefresh={fetchOptions}
          />
        ))
      )}
    </div>
  )
}

export default AdminFilterOptionsPage
