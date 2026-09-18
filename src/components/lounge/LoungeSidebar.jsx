// src/components/lounge/LoungeSidebar.jsx
import { MapPin, Users, Heart, ExternalLink } from 'lucide-react'

const LoungeSidebar = ({ lounge }) => {
  if (!lounge) return null

  const hasCoords = lounge.latitude && lounge.longitude
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lounge.latitude},${lounge.longitude}`
    : null

  return (
    <div className="space-y-10">

      {/* ===== ĐỊA CHỈ ===== */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#C3B665] mb-1">Location</h3>
          <p className="text-gray-400 flex items-start gap-2.5 leading-snug">
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
            {lounge.fullAddress || 'Updating'}
          </p>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 ml-6 inline-flex items-center gap-1.5 text-sm text-[#C3B665] hover:text-[#d4c87f] font-medium"
            >
              View map <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Khu vực hành chính */}
        {(lounge.ward || lounge.district || lounge.city) && (
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-bold text-[#C3B665] mb-1">Location</h3>
            <p className="text-gray-400">{[lounge.ward, lounge.district, lounge.city].filter(Boolean).join(', ')}</p>
          </div>
        )}
      </div>

      {/* ===== CỘNG ĐỒNG: số liệu thật từ BE ===== */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4 items-center justify-center text-center">
        <h3 className="text-sm font-bold text-[#C3B665] text-xl flex items-center gap-2">
          <Users size={22} /> Community
        </h3>
        <Heart size={35} className="text-red-500" />

        <div className="grid grid-cols-2 gap-6 w-full">
          <div>
            <p className="text-white font-bold text-2xl leading-tight">
              {formatCompactNumber(lounge.followerCount)}
            </p>
            <p className="text-gray-500 text-xs font-medium mt-1">Follower</p>
          </div>
          <div className="border-l border-gray-800">
            <p className="text-white font-bold text-2xl leading-tight">{lounge.upcomingShowCount ?? 0}</p>
            <p className="text-gray-500 text-xs font-medium mt-1">Upcoming Show</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoungeSidebar