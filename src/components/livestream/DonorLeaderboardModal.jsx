import { X, Trophy } from 'lucide-react'
import { anhChuCai } from '../../utils/anhChuCai'

const fmt = (v) => (v || 0).toLocaleString('vi-VN') + 'đ'

// Style hạng 1-2-3 (vàng - bạc - đồng)
const rankStyles = (i) => {
  if (i === 0) return { badge: 'bg-ember text-board', row: 'bg-warning/5 border-warning/25' }
  if (i === 1) return { badge: 'bg-lamp-mute text-board', row: 'bg-card/5 border-lamp/10' }
  if (i === 2) return { badge: 'bg-ember text-board', row: 'bg-warning/5 border-warning/25' }
  return { badge: 'bg-sunken text-ink-soft border border-line', row: 'border-transparent' }
}

const DonorLeaderboardModal = ({ donors, onClose }) => {
  const totalAmount = donors.reduce((s, d) => s + d.total, 0)
  const totalCount = donors.reduce((s, d) => s + d.count, 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/80"></div>

      <div className="relative bg-card border border-line w-full max-w-md max-h-[85vh] flex flex-col shadow-soft" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex justify-between items-start p-5 border-b border-line">
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Trophy size={18} className="text-ink" /> Donate leaderboard
            </h2>
            <p className="text-xs text-ink-mute mt-1">
              Tổng cộng <span className="text-ink font-bold">{fmt(totalAmount)}</span> · {totalCount} total {donors.length} donor
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sunken text-ink-soft transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* DANH SÁCH XẾP HẠNG (top → bottom) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-scrollbar">
          {donors.map((d, i) => {
            const style = rankStyles(i)
            return (
              <div key={d.key} className={`flex items-center gap-3 p-3 border transition-colors ${style.row}`}>

                {/* Hạng */}
                <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0 ${style.badge}`}>
                  {i + 1}
                </div>

                {/* Avatar + tên */}
                <img
                  src={d.avatarUrl || anhChuCai(d.name)}
                  alt={d.name}
                  className="w-9 h-9 object-cover border border-line-strong flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{d.name}</p>
                  <p className="text-[11px] text-ink-mute">{d.count} donate count</p>
                </div>

                {/* Tổng tiền */}
                <p className="text-sm font-bold text-ink flex-shrink-0">{fmt(d.total)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DonorLeaderboardModal