import { X, Trophy } from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('vi-VN') + 'đ'

// Style hạng 1-2-3 (vàng - bạc - đồng)
const rankStyles = (i) => {
  if (i === 0) return { badge: 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black', row: 'bg-yellow-500/5 border-yellow-500/25' }
  if (i === 1) return { badge: 'bg-gradient-to-br from-gray-200 to-gray-400 text-black', row: 'bg-white/5 border-white/10' }
  if (i === 2) return { badge: 'bg-gradient-to-br from-orange-300 to-orange-600 text-black', row: 'bg-orange-500/5 border-orange-500/25' }
  return { badge: 'bg-gray-800 text-gray-400 border border-gray-700', row: 'border-transparent' }
}

const DonorLeaderboardModal = ({ donors, onClose }) => {
  const totalAmount = donors.reduce((s, d) => s + d.total, 0)
  const totalCount = donors.reduce((s, d) => s + d.count, 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex justify-between items-start p-5 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy size={18} className="text-[#C3B665]" /> Bảng xếp hạng donate
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Tổng <span className="text-[#C3B665] font-bold">{fmt(totalAmount)}</span> · {totalCount} lượt từ {donors.length} người
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* DANH SÁCH XẾP HẠNG (top → bottom) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-scrollbar">
          {donors.map((d, i) => {
            const style = rankStyles(i)
            return (
              <div key={d.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${style.row}`}>

                {/* Hạng */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${style.badge}`}>
                  {i + 1}
                </div>

                {/* Avatar + tên */}
                <img
                  src={d.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(d.name)}&backgroundColor=C3B665`}
                  alt={d.name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-600 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{d.name}</p>
                  <p className="text-[11px] text-gray-500">{d.count} lượt donate</p>
                </div>

                {/* Tổng tiền */}
                <p className="text-sm font-bold text-[#C3B665] flex-shrink-0">{fmt(d.total)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DonorLeaderboardModal