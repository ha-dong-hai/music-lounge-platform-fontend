// src/components/shared/DemNguocGioDien.jsx
//
// ĐẾM NGƯỢC TỚI GIỜ DIỄN (D3 "vé điện tử sống", chủ dự án chọn 02/10/2026) — ô chữ lật ngày : giờ : phút.
//
// QUY TẮC:
//  - CHỈ dùng SAU KHI ĐÃ MUA (trang chi tiết vé đã thanh toán). KHÔNG BAO GIỜ đặt ở trang bán vé: đồng hồ đếm ngược khi
//    mua là mẫu lừa dối "fake urgency" (deceptive.design; Blick.ch: 5/5 nền tảng vé Thuỵ Sĩ dùng nó).
//  - Cập nhật mỗi PHÚT, không theo giây: đủ cho người cầm vé, không nhảy số liên tục; không aria-live (không đọc to mỗi
//    phút) — câu đầy đủ ở sr-only.
//  - Đã tới giờ thì không in (trang vé tự lo trạng thái "đang diễn"/"đã diễn").
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import KyTuLat from '../program/KyTuLat'
import { useTranslation } from 'react-i18next'

const DemNguocGioDien = ({ batDau, className = '' }) => {
  const { t } = useTranslation()
  const [bayGio, setBayGio] = useState(() => dayjs())
  useEffect(() => {
    const id = setInterval(() => setBayGio(dayjs()), 60_000)
    return () => clearInterval(id)
  }, [])

  const con = dayjs(batDau).diff(bayGio, 'minute')
  if (!batDau || con <= 0) return null
  const ngay = Math.floor(con / 1440), gio = Math.floor((con % 1440) / 60), phut = con % 60
  const hai = (n) => String(n).padStart(2, '0')
  const cau = ngay ? t('Còn {{ngay}} ngày {{gio}} giờ {{phut}} phút tới giờ diễn', { ngay, gio, phut }) : t('Còn {{gio}} giờ {{phut}} phút tới giờ diễn', { gio, phut })

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <p className="text-xs text-ink-soft">{t('Tới giờ diễn còn')}</p>
      <div aria-hidden="true" className="flex items-end gap-3">
        {ngay > 0 && <span className="flex flex-col items-center gap-1"><KyTuLat key={`n${ngay}`} chu={hai(ngay)} tone="ink" className="text-xl" /><span className="text-[11px] text-ink-mute">{t('ngày')}</span></span>}
        <span className="flex flex-col items-center gap-1"><KyTuLat key={`g${gio}`} chu={hai(gio)} tone="ink" className="text-xl" /><span className="text-[11px] text-ink-mute">{t('giờ')}</span></span>
        <span className="flex flex-col items-center gap-1"><KyTuLat key={`p${phut}`} chu={hai(phut)} tone="ink" className="text-xl" /><span className="text-[11px] text-ink-mute">{t('phút')}</span></span>
      </div>
      <p className="sr-only">{cau}</p>
    </div>
  )
}

export default DemNguocGioDien
