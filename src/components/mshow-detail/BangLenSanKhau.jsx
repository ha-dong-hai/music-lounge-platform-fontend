// src/components/mshow-detail/BangLenSanKhau.jsx
//
// BẢNG "ĐANG LÊN SÂN KHẤU" (D1, chủ dự án chọn 02/10/2026) — chỉ khi buổi ĐANG diễn: ai đang hát, ai lên kế tiếp, tính
// theo giờ lên sân khấu THẬT của từng tiết mục (PerformerSummaryDto.setTime). In bằng ô chữ lật KyTuLat — mặt chữ "bảng
// điện" ĐÃ CÓ của thế giới (bảng giờ diễn trang chủ); không dựng chữ chấm LED vì phải dùng mask gradient trang trí
// (DESIGN.md chỉ cho phép mask ở cuống vé) và repo đã có sẵn một mặt chữ bảng điện.
//
// QUY TẮC:
//  - Không tiết mục nào có giờ → KHÔNG in bảng (không bịa ai đang hát).
//  - Giờ tiết mục ghép với NGÀY của buổi diễn (giờ Việt Nam); giờ tiết mục sớm hơn giờ mở màn quá 6 tiếng thì coi là
//    sau nửa đêm (buổi diễn kéo qua 0h).
//  - Cập nhật mỗi 30 giây; đổi tiết mục thì ô chữ lật lại một lần (key theo tiết mục) — bảng "vừa cập nhật".
//  - Giờ là dữ liệu dự kiến của phòng trà, không phải cảm biến sân khấu → ghi rõ "theo lịch".
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import KyTuLat from '../program/KyTuLat'
import { SongAm } from '../program/NhanDangDien'

const CHU_KY_MS = 30_000
const QUA_NUA_DEM_GIO = 6

const ghepGio = (batDau, setTime) => {
  if (typeof setTime !== 'string' || setTime.length < 5) return null
  const [h, m] = setTime.split(':').map(Number)
  let t = dayjs(batDau).hour(h).minute(m).second(0).millisecond(0)
  if (t.isBefore(dayjs(batDau).subtract(QUA_NUA_DEM_GIO, 'hour'))) t = t.add(1, 'day')
  return t
}

// Một dòng của bảng — khai báo NGOÀI component cha (khai báo bên trong thì mỗi lần render là component mới, ô chữ lật
// bị dựng lại liên tục).
const Dong = ({ nhan, p }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
    <span className="w-24 text-sm text-lamp-mute">{nhan}</span>
    <KyTuLat key={`${nhan}-${p.performanceId ?? p.id}`} chu={p.luc.format('HH:mm')} tone={nhan === 'Đang hát' ? 'ember' : 'lamp'} className="text-lg" />
    <KyTuLat key={`${nhan}-ten-${p.performanceId ?? p.id}`} chu={p.name.toUpperCase().slice(0, 22)} treMs={180} className="text-base sm:text-lg flex-wrap" />
  </div>
)

const BangLenSanKhau = ({ performers = [], batDau }) => {
  const [bayGio, setBayGio] = useState(() => dayjs())
  useEffect(() => {
    const id = setInterval(() => setBayGio(dayjs()), CHU_KY_MS)
    return () => clearInterval(id)
  }, [])

  const tietMuc = useMemo(() => performers
    .map((p) => ({ ...p, luc: ghepGio(batDau, p.setTime) }))
    .filter((p) => p.luc)
    .sort((a, b) => a.luc.valueOf() - b.luc.valueOf()), [performers, batDau])

  if (!batDau || tietMuc.length === 0) return null

  const daLen = tietMuc.filter((p) => !p.luc.isAfter(bayGio))
  const dang = daLen[daLen.length - 1] ?? null
  const ke = tietMuc.find((p) => p.luc.isAfter(bayGio)) ?? null

  return (
    <section aria-label="Đang lên sân khấu" aria-live="polite" className="mb-10 bg-board text-lamp border-[3px] border-ink shadow-lift p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs text-lamp-mute mb-4">
        {dang && <SongAm className="h-3 text-ember" />}
        Sân khấu lúc này · theo lịch phòng trà
      </p>
      <div className="space-y-3">
        {dang && <Dong nhan="Đang hát" p={dang} />}
        {ke && <Dong nhan={dang ? 'Kế tiếp' : 'Sắp lên'} p={ke} />}
        {!ke && dang && <p className="text-sm text-lamp-mute">Đây là tiết mục cuối theo lịch.</p>}
      </div>
    </section>
  )
}

export default BangLenSanKhau
