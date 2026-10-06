// src/components/home/MoodExplorer.jsx
import { useNavigate } from 'react-router-dom'
import {
  Flame, Heart, Moon, Disc3, Waves, Gem, Coffee, Trees, Square, PenLine,
} from 'lucide-react'

// Icon cố định theo TÊN thật trả về từ backend — nếu Admin đổi tên danh mục, mục đó rơi về icon
// mặc định (Disc3) thay vì vỡ trang.
const MOOD_ICON = {
  'Sôi động': Flame, 'Lãng mạn': Heart, 'Thư giãn': Moon, 'Hoài niệm': Disc3,
  'Sâu lắng': Waves, 'Sang trọng': Gem, 'Ấm cúng': Coffee, 'Ngoài trời': Trees,
  'Hiện đại': Square, 'Cổ điển': PenLine,
}

const MoodExplorer = ({ moods = [], atmospheres = [] }) => {
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
      <div className="mb-4 sm:mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-text mb-1">Gợi ý không gian theo tâm trạng</p>
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink">Khám phá theo không khí</h2>
      </div>
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
        {items.map((item) => {
          const Icon = MOOD_ICON[item.name] || Disc3
          return (
            <button
              key={`${item.kind}-${item.id}`}
              onClick={() => goTo(item)}
              className="flex-shrink-0 inline-flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full border border-line bg-card text-sm font-medium text-ink-soft hover:border-brand hover:text-ink transition-colors"
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