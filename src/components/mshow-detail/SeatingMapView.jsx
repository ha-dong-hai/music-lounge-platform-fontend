// src/components/mshow-detail/SeatingMapView.jsx

import { useState, useEffect } from 'react'
import { Loader2, Map, Info } from 'lucide-react'
import { getShowSeatingMap } from '../../services/showServices'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const khoangGia = (z) => {
  if (z.minPrice == null && z.maxPrice == null) return null
  if (z.minPrice === z.maxPrice) return fmtTien(z.minPrice)
  return `${fmtTien(z.minPrice)} – ${fmtTien(z.maxPrice)}`
}

const nhanConLai = (z) => {
  if (z.availableCount == null) return 'Còn vé'
  if (z.availableCount <= 0) return 'Hết vé'
  return `còn ${z.availableCount}`
}

const SeatingMapView = ({ showId, selectedZoneId, onSelectZone }) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!showId) return
    const chay = async () => {
      setIsLoading(true)
      try {
        const res = await getShowSeatingMap(showId)
        if (res.success) setData(res.data)
      } catch {
        setData(null) // Sơ đồ là bổ trợ: lỗi không được chặn việc mua vé
      } finally {
        setIsLoading(false)
      }
    }
    chay()
  }, [showId])

  if (isLoading) {
    return (
      <div className="bg-card border border-line rounded-2xl py-16 flex justify-center">
        <Loader2 size={26} className="animate-spin text-brand-text" />
      </div>
    )
  }

  const zones = data?.zones ?? []
  if (zones.length === 0) return null

  const coViTri = zones.filter((z) => z.layout2DX != null && z.layout2DY != null)
  const chuaCoViTri = zones.filter((z) => z.layout2DX == null || z.layout2DY == null)

  return (
    <div className="bg-card border border-line rounded-2xl p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
          <Map size={18} /> Sơ đồ khu vực
        </h3>
        {selectedZoneId != null && (
          <button onClick={() => onSelectZone?.(null)}
            className="px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
            Xem tất cả khu vực
          </button>
        )}
      </div>

      {coViTri.length > 0 && (
        <>
          <div className="relative w-full rounded-xl overflow-hidden border border-line bg-page"
            style={{ aspectRatio: '16 / 9' }}>
            {data.areaLayoutImageUrl && (
              <img src={data.areaLayoutImageUrl} alt="Mặt bằng phòng trà"
                className="absolute inset-0 w-full h-full object-cover opacity-45" />
            )}

            {coViTri.map((z) => {
              const laChon = selectedZoneId === z.zoneId
              const hetVe = z.availableCount != null && z.availableCount <= 0
              return (
                <button
                  key={z.zoneId}
                  type="button"
                  onClick={() => onSelectZone?.(laChon ? null : z.zoneId)}
                  title={`${z.name} — ${nhanConLai(z)}`}
                  className={`absolute flex flex-col items-center justify-center rounded-lg border-2 px-1 overflow-hidden transition-all ${
                    laChon ? 'border-brand ring-2 ring-brand/40 z-10' : 'border-white/25 hover:border-white/60'
                  } ${hetVe ? 'opacity-45' : ''}`}
                  style={{
                    left: `${z.layout2DX}%`,
                    top: `${z.layout2DY}%`,
                    width: `${z.layout2DWidth ?? 12}%`,
                    height: `${z.layout2DHeight ?? 12}%`,
                    transform: `rotate(${z.layout2DRotationDeg ?? 0}deg)`,
                    backgroundColor: z.color ? `${z.color}55` : 'rgba(195,182,101,0.20)',
                  }}
                >
                  <span className="text-[10px] sm:text-xs font-bold text-ink leading-tight text-center truncate max-w-full">{z.name}</span>
                  <span className="text-[9px] sm:text-[10px] text-ink-soft/90 leading-tight">{nhanConLai(z)}</span>
                </button>
              )
            })}
          </div>

          <p className="text-xs text-ink-mute mt-3 flex items-start gap-1.5 leading-relaxed">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            Bấm vào một khu vực để chỉ xem hạng vé của khu đó. Sơ đồ chỉ hiện khu vực có bán vé trong buổi diễn này.
          </p>
        </>
      )}

      {chuaCoViTri.length > 0 && (
        <div className={coViTri.length > 0 ? 'mt-5 pt-5 border-t border-line' : ''}>
          {coViTri.length > 0 && (
            <p className="text-xs text-ink-mute mb-3 leading-relaxed">
              Những khu vực sau đang bán vé nhưng chưa được đặt vị trí trên sơ đồ:
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {chuaCoViTri.map((z) => {
              const laChon = selectedZoneId === z.zoneId
              return (
                <button key={z.zoneId} type="button"
                  onClick={() => onSelectZone?.(laChon ? null : z.zoneId)}
                  className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                    laChon ? 'border-brand bg-brand/10' : 'border-line hover:border-line-strong'
                  }`}>
                  <span className="block text-sm text-ink font-medium">{z.name}</span>
                  <span className="block text-xs text-ink-mute mt-0.5">
                    {nhanConLai(z)}
                    {khoangGia(z) && ` · ${khoangGia(z)}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatingMapView