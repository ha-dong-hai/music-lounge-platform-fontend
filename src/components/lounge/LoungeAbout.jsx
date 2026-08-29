// src/components/lounge/LoungeAbout.jsx
import { Users } from 'lucide-react'
import { LOUNGE_SEATING_AREAS } from '../../constants/mockData'

const LoungeAbout = ({ lounge }) => {
  if (!lounge) return null

  return (
    <div className="space-y-10">
      {/* GIỚI THIỆU PHÒNG TRÀ */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#C3B665] mb-6">Về không gian của chúng tôi</h2>
        <div className="prose max-w-none text-gray-300 text-lg leading-relaxed whitespace-pre-line">
          {lounge.description}
        </div>
      </div>

      {/* KHU VỰC CHỖ NGỒI */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Khu vực chỗ ngồi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {LOUNGE_SEATING_AREAS.map(area => (
            <div key={area.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-[#C3B665]/40 transition-colors group">
              <div className="relative h-44 overflow-hidden">
                <img src={area.image} alt={area.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <Users size={12} /> {area.capacity} chỗ
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-white font-bold text-lg mb-2">{area.name}</h3>
                <p className="text-gray-400 text-sm leading-snug">{area.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoungeAbout