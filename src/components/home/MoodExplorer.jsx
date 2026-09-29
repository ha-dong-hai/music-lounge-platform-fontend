// src/components/home/MoodExplorer.jsx
import { useNavigate } from 'react-router-dom'
import {
  Flame, Heart, Moon, Disc3, Waves, Gem, Coffee, Trees, Square, PenLine,
} from 'lucide-react'
import SectionTitle from '../shared/SectionTitle'

// Icon cố định theo TÊN thật trả về từ backend — nếu Admin đổi tên danh mục, mục đó rơi về icon
// mặc định (Disc3) thay vì vỡ trang.
const MOOD_ICON = {
  'Sôi động': Flame, 'Lãng mạn': Heart, 'Thư giãn': Moon, 'Hoài niệm': Disc3,
  'Sâu lắng': Waves, 'Sang trọng': Gem, 'Ấm cúng': Coffee, 'Ngoài trời': Trees,
  'Hiện đại': Square, 'Cổ điển': PenLine,
}

// `hienTieuDe=false` khi khối này nằm BÊN TRONG mục 'Tìm theo' của trang chủ: ở đó nó đã có
// tiêu đề mục chung rồi, thêm một tiêu đề nữa là hai tầng tiêu đề cho một việc.
const MoodExplorer = ({ moods = [], atmospheres = [], hienTieuDe = true }) => {
  const navigate = useNavigate()
  const items = [
    ...moods.map(m => ({ ...m, kind: 'mood' })),
    ...atmospheres.map(a => ({ ...a, kind: 'atmosphere' })),
  ]
  if (items.length === 0) return null

  const goTo = (item) => {
    const key = item.kind === 'mood' ? 'selectedMoods' : 'selectedSpaces'
    navigate('/shows/search', { state: { appliedFilters: { selectedMoods: [], selectedSpaces: [], selectedGenres: [], [key]: [item.name] } } })
  }

  return (
    <section>
      {hienTieuDe && (
        <SectionTitle
          nhan="Gợi ý không gian theo tâm trạng"
          tieuDe="Khám phá theo không khí"
          ghiChu="Chọn một không khí để lọc đêm diễn"
        />
      )}
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
        {items.map((item) => {
          const Icon = MOOD_ICON[item.name] || Disc3
          return (
            <button
              key={`${item.kind}-${item.id}`}
              onClick={() => goTo(item)}
              className="flex-shrink-0 inline-flex items-center gap-2 min-h-[44px] pl-3.5 pr-4 py-2.5 rounded-full border border-line bg-card text-sm font-medium text-ink-soft hover:border-brand hover:text-ink transition-colors"
            >
              <Icon size={16} className="text-brand-text flex-shrink-0" strokeWidth={1.5} />
              {item.name}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default MoodExplorer