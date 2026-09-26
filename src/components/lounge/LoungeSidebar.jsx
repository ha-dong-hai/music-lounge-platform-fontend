// src/components/lounge/LoungeSidebar.jsx
import { MapPin, Users, Heart, ExternalLink, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCompactNumber } from '../../utils/format'

const LoungeSidebar = ({ lounge }) => {
  if (!lounge) return null

  const hasCoords = lounge.latitude && lounge.longitude
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lounge.latitude},${lounge.longitude}`
    : null

  return (
    <div className="space-y-10">

      {/* ===== ĐẶT ĐỒ UỐNG / MÓN ĂN ===== */}
      <Link
        to={`/lounge/${lounge.id}/order`}
        className="flex items-center justify-center gap-2 w-full bg-brand text-on-brand font-bold py-3 rounded-xl hover:bg-brand-hover transition-colors"
      >
        <UtensilsCrossed size={18} /> Đặt đồ uống &amp; món ăn
      </Link>

      {/* ===== ĐỊA CHỈ ===== */}
      <div className="bg-card border border-line rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-brand-text mb-1">Địa điểm</h3>
          <p className="text-ink-soft flex items-start gap-2.5 leading-snug">
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
            {lounge.fullAddress || 'Updating'}
          </p>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 ml-6 inline-flex items-center gap-1.5 text-sm text-brand-text hover:text-brand-text font-medium"
            >
              Xem bản đồ <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Khu vực hành chính */}
        {(lounge.ward || lounge.district || lounge.city) && (
          <div className="border-t border-line pt-4">
            <h3 className="text-sm font-bold text-brand-text mb-1">Địa điểm</h3>
            <p className="text-ink-soft">{[lounge.ward, lounge.district, lounge.city].filter(Boolean).join(', ')}</p>
          </div>
        )}
      </div>

      {/* ===== CỘNG ĐỒNG: số liệu thật từ BE ===== */}
      <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-4 items-center justify-center text-center">
        <h3 className="text-sm font-bold text-brand-text text-xl flex items-center gap-2">
          <Users size={22} /> Cộng đồng
        </h3>
        <Heart size={35} className="text-danger" />

        <div className="grid grid-cols-2 gap-6 w-full">
          <div>
            <p className="text-ink font-bold text-2xl leading-tight">
              {formatCompactNumber(lounge.followerCount)}
            </p>
            <p className="text-ink-mute text-xs font-medium mt-1">Người theo dõi</p>
          </div>
          <div className="border-l border-line">
            <p className="text-ink font-bold text-2xl leading-tight">{lounge.upcomingShowCount ?? 0}</p>
            <p className="text-ink-mute text-xs font-medium mt-1">Sắp diễn ra</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoungeSidebar