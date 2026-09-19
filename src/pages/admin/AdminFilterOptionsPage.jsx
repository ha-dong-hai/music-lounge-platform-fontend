import { useState, useEffect } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { getFilterOptions } from '../../services/showServices' //  TÁI DÙNG service sẵn có
import OptionTypeTab from '../../components/admin/filter-options/OptionTypeTab'

// Cấu hình 3 tab — genres có nameEn, 2 loại kia không
const TABS = [
  { key: 'genres',      label: 'Genres',      typeLabel: 'Genre',      hasNameEn: true },
  { key: 'moods',       label: 'Moods',       typeLabel: 'Mood',       hasNameEn: false },
  { key: 'atmospheres', label: 'Atmospheres', typeLabel: 'Atmosphere', hasNameEn: false },
]

const AdminFilterOptionsPage = () => {
  const [activeTab, setActiveTab] = useState('genres')
  const [options, setOptions] = useState({ genres: [], moods: [], atmospheres: [], cities: [] })
  const [isLoading, setIsLoading] = useState(true)

  // FETCH 1 LẦN LẤY CẢ 3 LOẠI (API trả gộp trong 1 response)
  const fetchOptions = async () => {
    setIsLoading(true)
    try {
      const res = await getFilterOptions()
      if (res.success) {
        setOptions({
          genres: res.data.genres || [],
          moods: res.data.moods || [],
          atmospheres: res.data.atmospheres || [],
          cities: res.data.cities || [],
        })
      }
    } catch (err) {
      console.error('Lỗi tải filter options:', err)
      toast.error('Failed to load filter options')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <SlidersHorizontal size={28} className="text-[#C3B665]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Filter Options</h1>
          <p className="text-gray-400 text-sm">
            Manage genres, moods and atmospheres used in show filters across the platform.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-6 border-b border-gray-800">
        <div className="flex gap-8">
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
            options={options[tab.key]}
            onRefresh={fetchOptions}
          />
        ))
      )}
    </div>
  )
}

export default AdminFilterOptionsPage