// src/components/lounge/LoungeAbout.jsx
import { Users, MapPin } from 'lucide-react'

const LoungeAbout = ({ lounge, zones = [] }) => {
  if (!lounge) return null

  const hasZones = zones.length > 0
  const hasLayoutImage = !!lounge.areaLayoutImageUrl

  return (
    <div className="space-y-10">

      {/* GIỚI THIỆU PHÒNG TRÀ */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#C3B665] mb-6">Về không gian của chúng tôi</h2>
        <div className="prose max-w-none text-gray-300 text-lg leading-relaxed whitespace-pre-line">
          {lounge.description}
        </div>
      </div>

      {/* KHU VỰC CHỖ NGỒI — từ BE zones thật */}
      {hasZones && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Khu vực chỗ ngồi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {zones.map(zone => (
              <div key={zone.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-[#C3B665]/40 transition-colors">
                {/* Thanh màu zone (layoutColor từ BE) */}
                <div className="h-1.5" style={{ backgroundColor: zone.layoutColor || '#C3B665' }} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <MapPin size={16} className="text-[#C3B665] flex-shrink-0" />
                      {zone.name}
                    </h3>
                    <span className="flex-shrink-0 inline-flex items-center gap-1 bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full border border-white/10">
                      <Users size={12} /> {zone.capacity} chỗ
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-snug min-h-[40px]">
                    {zone.description || 'Khu vực ngồi thoải mái với tầm nhìn tốt tới sân khấu.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FALLBACK: ảnh sơ đồ layout tổng nếu không có zones */}
      {!hasZones && hasLayoutImage && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Sơ đồ khu vực</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <img src={lounge.areaLayoutImageUrl} alt="Sơ đồ khu vực" className="w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

export default LoungeAbout