// src/components/myshows/KyNiemDemDaDen.jsx
//
// KỶ NIỆM ĐÊM ĐÃ ĐẾN — đầu tab Vé của tôi: mỗi buổi diễn khách ĐÃ THẬT SỰ có mặt in thành một tấm ảnh Polaroid, chữ viết
// tay "Đã đến · Thứ năm 22/10 · 19:41". 02/10/2026 chủ dự án chọn (P2, reports/Polaroid và kỹ thuật số.md).
//
// DỮ LIỆU THẬT, KHÔNG BỊA:
//  - "Đã đến" = TicketListItemDto.attendedAt (MLACP-546): vé tại chỗ là giờ quét vào cửa, vé trực tuyến là lần đầu vào
//    xem. Vé đã mua mà không đến thì KHÔNG có tấm ảnh nào — kỷ niệm chỉ cho đêm có thật.
//  - Ảnh = showImageUrl (ảnh bìa buổi, chưa có thì ảnh phòng trà); không có/lỗi ảnh thì ô "Chưa có ảnh" của trang.
//  - Một buổi một tấm (mua nhiều vé cùng buổi vẫn là một đêm), giờ ghi theo lần đến SỚM nhất.
//  - Gọi riêng một lần các vé ĐÃ DIỄN (when=Past, tối đa 100) — không lấy từ trang 10 vé đang xem, để đêm nằm ở trang 2
//    không bị sót. Lỗi tải thì im lặng không in khối (đây là phần thêm, danh sách vé bên dưới vẫn đủ).
//
// THU GỌN (quy trình UI/UX): in SO_HIEN tấm đầu (mới nhất trước), còn lại mở bằng nút "Xem thêm N đêm" (aria-expanded).
// Nghiêng cố định theo vị trí (không ngẫu nhiên); rê chuột thì tấm ảnh thẳng lại và nhấc lên — chỉ khi không bật giảm
// chuyển động (motion-safe).
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyTickets } from '../../services/ticketServices'
import CoverFallback from '../shared/CoverFallback'
import IconMoRong from '../shared/IconMoRong'
import { thuVietHoa, ngayGon, gioTrongNgay } from '../../utils/ngayVietNam'
import dayjs from 'dayjs'

const SO_HIEN = 6
const XOAY = ['-rotate-2', 'rotate-[1.5deg]', '-rotate-1', 'rotate-[2.5deg]', '-rotate-[1.5deg]', 'rotate-1']

const TamAnh = ({ dem, i }) => {
  const [hong, setHong] = useState(false)
  const d = dayjs(dem.attendedAt)
  return (
    <li className={`w-[11.5rem] sm:w-52 ${XOAY[i % XOAY.length]} motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:rotate-0 motion-safe:hover:-translate-y-1`}>
      <Link to={`/my-shows/ticket/${dem.ticketId}`} className="group block bg-card p-2.5 pb-0 shadow-lift border border-ink/10 focus-visible:outline-2">
        <div className="aspect-square w-full overflow-hidden bg-board">
          {dem.anh && !hong
            ? <img src={dem.anh} alt="" loading="lazy" onError={() => setHong(true)} className="w-full h-full object-cover" />
            : <CoverFallback />}
        </div>
        <div className="px-1 pt-2 pb-3 font-hand text-ink leading-tight">
          <p className="text-lg truncate">{dem.ten}</p>
          <p className="text-base text-ink-soft">Đã đến · {thuVietHoa(d)} {ngayGon(d)} · {gioTrongNgay(d)}</p>
        </div>
      </Link>
    </li>
  )
}

const KyNiemDemDaDen = () => {
  const [ve, setVe] = useState([])
  const [moHet, setMoHet] = useState(false)

  useEffect(() => {
    let huy = false
    getMyTickets({ when: 'Past', page: 1, pageSize: 100 })
      .then((res) => { if (!huy && res?.success) setVe(res.data?.items ?? []) })
      .catch(() => {})
    return () => { huy = true }
  }, [])

  const dem = useMemo(() => {
    const theoBuoi = new Map()
    for (const t of ve) {
      if (!t.attendedAt) continue
      const cu = theoBuoi.get(t.showId)
      if (!cu || dayjs(t.attendedAt).isBefore(cu.attendedAt))
        theoBuoi.set(t.showId, { showId: t.showId, ticketId: t.id, ten: t.showName, anh: t.showImageUrl, attendedAt: t.attendedAt })
    }
    return [...theoBuoi.values()].sort((a, b) => dayjs(b.attendedAt).valueOf() - dayjs(a.attendedAt).valueOf())
  }, [ve])

  if (dem.length === 0) return null
  const hien = moHet ? dem : dem.slice(0, SO_HIEN)
  const an = dem.length - SO_HIEN

  return (
    <section aria-labelledby="ky-niem-td" className="mb-10">
      <h2 id="ky-niem-td" className="text-3xl sm:text-4xl">Những đêm bạn đã đến <span className="font-mono text-xl text-ink-mute align-middle">· {dem.length}</span></h2>
      <p className="text-ink-soft mt-1 mb-6">Mỗi tấm là một buổi bạn đã có mặt — bấm để xem lại vé.</p>
      <ul id="ky-niem-ds" className="flex flex-wrap gap-x-6 gap-y-8 px-1">
        {hien.map((d, i) => <TamAnh key={d.showId} dem={d} i={i} />)}
      </ul>
      {an > 0 && (
        <button type="button" onClick={() => setMoHet((v) => !v)} aria-expanded={moHet} aria-controls="ky-niem-ds"
          className="inline-flex items-center gap-1.5 min-h-[44px] mt-4 text-sm font-semibold text-ink hover:text-board">
          {moHet ? <><IconMoRong mo /> Thu gọn</> : <><IconMoRong /> Xem thêm {an} đêm</>}
        </button>
      )}
    </section>
  )
}

export default KyNiemDemDaDen
