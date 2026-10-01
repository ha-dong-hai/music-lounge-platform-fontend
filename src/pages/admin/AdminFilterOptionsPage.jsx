// src/pages/admin/AdminFilterOptionsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — BA NGUỒN DỮ LIỆU, ĐỪNG GỘP:
//   moods / atmospheres  →  GET /shows/filter-options (trả gộp, chỉ id + name — đủ cho hai loại này)
//   genres               →  GET /admin/genres         (có nameEn; đường công khai KHÔNG trả nameEn)
//   eventCategories      →  GET /admin/event-categories (có description + isActive, và KHÔNG lọc
//                                                        mục đã tắt)
// VÌ SAO PHẢI DÙNG ĐƯỜNG /admin CHO HAI LOẠI SAU: PUT là ghi đè toàn bộ. Nếu đọc bằng đường công
// khai thì nameEn / description không đọc được, và bấm Lưu là ghi rỗng lên giá trị cũ. Trước đây FE
// phải hiện cảnh báo cho người dùng tự gõ lại — nay đọc được thật nên bỏ cảnh báo đó.
// Riêng loại buổi diễn: đường công khai chỉ trả mục đang bật, nên nếu đọc bằng nó thì tắt một mục
// đi là không còn đường bật lại. Đường /admin trả cả mục đã tắt, nên bật lại được.
import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { getFilterOptions } from '../../services/showServices' //  TÁI DÙNG service sẵn có
import { getAdminEventCategories, getAdminGenres } from '../../services/adminServices'
import OptionTypeTab from '../../components/admin/filter-options/OptionTypeTab'

// Cấu hình 4 tab — genres có nameEn, eventCategories có description, 2 loại kia chỉ có name.
// `typeKey` phải trùng khoá trong FILTER_OPTION_TYPES ở adminServices.js.
const TABS = [
  { key: 'genres',          label: 'Thể loại',          typeLabel: 'thể loại',          hasNameEn: true },
  { key: 'moods',           label: 'Tâm trạng',           typeLabel: 'tâm trạng',           hasNameEn: false },
  { key: 'atmospheres',     label: 'Không gian',     typeLabel: 'không gian',     hasNameEn: false },
  { key: 'eventCategories', label: 'Loại buổi diễn',  typeLabel: 'loại buổi diễn', hasNameEn: false, hasDescription: true, hasIsActive: true },
]

const AdminFilterOptionsPage = () => {
  const [activeTab, setActiveTab] = useState('genres')
  const [options, setOptions] = useState({ genres: [], moods: [], atmospheres: [], cities: [], eventCategories: [] })
  // Loại nào tải lỗi (01/10/2026): bản cũ bật toast rồi tab đó báo 'Chưa có … nào' — Admin tưởng danh mục bị xoá.
  const [loaiLoi, setLoaiLoi] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  // BA NGUỒN, GỌI SONG SONG VÀ ĐỘC LẬP: một cái lỗi chỉ làm trống tab của nó, không trắng cả trang.
  const fetchOptions = useCallback(async () => {
    setIsLoading(true)
    setLoaiLoi({})
    const [loc, theLoai, loai] = await Promise.allSettled([
      getFilterOptions(), getAdminGenres(), getAdminEventCategories(),
    ])

    // filter-options giờ chỉ còn dùng cho moods + atmospheres; thể loại nhạc lấy từ /admin/genres
    // vì đường này mới có nameEn.
    if (loc.status === 'fulfilled' && loc.value?.success) {
      const d = loc.value.data || {}
      setOptions((prev) => ({
        ...prev,
        moods: d.moods || [],
        atmospheres: d.atmospheres || [],
        cities: d.cities || [],
      }))
    } else {
      setLoaiLoi((p) => ({ ...p, moods: true, atmospheres: true }))
    }

    if (theLoai.status === 'fulfilled' && theLoai.value?.success) {
      setOptions((prev) => ({ ...prev, genres: theLoai.value.data || [] }))
    } else {
      setLoaiLoi((p) => ({ ...p, genres: true }))
    }

    if (loai.status === 'fulfilled' && loai.value?.success) {
      setOptions((prev) => ({ ...prev, eventCategories: loai.value.data || [] }))
    } else {
      setLoaiLoi((p) => ({ ...p, eventCategories: true }))
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
        <div>
          <h1 className="text-4xl text-ink">Danh mục phân loại</h1>
          <p className="text-ink-soft text-sm">
            Quản lý thể loại, tâm trạng, không gian và danh mục dùng trong bộ lọc buổi diễn trên toàn nền tảng.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-6 border-b border-line">
        <div className="flex flex-wrap gap-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)} aria-pressed={activeTab === tab.key}
              className={`min-h-[44px] pb-3 text-base font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-mute hover:text-ink'
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs font-medium ${activeTab === tab.key ? 'text-ink' : 'text-ink-mute'}`}>
                {options[tab.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* NỘI DUNG TAB */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-ink" />
        </div>
      ) : (
        TABS.filter(tab => tab.key === activeTab).map(tab => (
          <OptionTypeTab
            key={tab.key}
            typeKey={tab.key}
            typeLabel={tab.typeLabel}
            hasNameEn={tab.hasNameEn}
            hasDescription={tab.hasDescription}
            hasIsActive={tab.hasIsActive}
            options={options[tab.key]}
            loi={!!loaiLoi[tab.key]}
            onRefresh={fetchOptions}
          />
        ))
      )}
    </div>
  )
}

export default AdminFilterOptionsPage
