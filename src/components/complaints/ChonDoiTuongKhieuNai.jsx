// src/components/complaints/ChonDoiTuongKhieuNai.jsx
//
// MLACP-680 — CHỌN đối tượng bị khiếu nại thay vì DÁN MÃ. Chủ dự án 06/10/2026: "các chỗ show ID … làm cho đúng". Trước
// đây ô này là một ô chữ "Dán mã từ đường dẫn" bắt người dùng tìm dãy 36 ký tự trong thanh địa chỉ.
//
// - Đã đăng nhập: chọn trong danh sách của chính mình — vé, buổi diễn đã mua vé, buổi phát trực tuyến, khoản ủng hộ, án
//   phạt (chủ phòng trà). Phòng trà: danh sách phòng trà công khai (ai cũng chọn được).
// - Không có trong danh sách (hoặc chưa đăng nhập): dán CẢ ĐƯỜNG DẪN trang (…/shows/<mã>, …/livestream/<mã>…) — tự lấy mã
//   ra, không phải cắt chuỗi bằng tay. Dán riêng mã vẫn được.
// - "Buổi phát trực tuyến": đường dẫn trang xem là /livestream/<mã BUỔI DIỄN>, nên lựa chọn và đường dẫn đều mang mã buổi
//   diễn; backend (MLACP-680) nhận cả mã buổi diễn cho loại này.
import { useEffect, useState } from 'react'
import { getMyTickets } from '../../services/ticketServices'
import { getMyDonations } from '../../services/donationServices'
import { getLounges } from '../../services/loungeServices'
import { getMyPenalties } from '../../services/penaltyServices'
import { ngayDayDu } from '../../utils/ngayVietNam'
import { laVeTrucTuyen } from '../../utils/trangThaiVe'

const MA = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
/** Lấy mã GUID từ một đường dẫn hoặc chuỗi bất kỳ người dùng dán vào; không có thì chuỗi rỗng. */
const layMa = (s) => (String(s || '').match(MA)?.[0] ?? '')

const DAN = '__dan'
const tien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const mang = (res) => res?.data?.items ?? res?.data ?? []
const TEN_AN = { Warning: 'Cảnh cáo', Suspension: 'Tạm khoá', Ban: 'Khoá vĩnh viễn' }

async function taiLuaChon(loai, user) {
  if (loai === 'venue') {
    return mang(await getLounges({ page: 1, pageSize: 100 })).map((l) => ({ id: l.id, nhan: [l.name, l.address?.city ?? l.city].filter(Boolean).join(' · ') }))
  }
  if (!user) return []
  if (loai === 'ticket' || loai === 'show' || loai === 'livestream') {
    const ves = mang(await getMyTickets({ page: 1, pageSize: 50 }))
    if (loai === 'ticket') return ves.map((t) => ({ id: t.id, nhan: `${t.tierName} · ${t.showName} · ${ngayDayDu(t.showScheduledStart)}` }))
    // Buổi phát trực tuyến: chỉ những buổi mình có vé xem trực tuyến — vé ngồi tại phòng trà không xem được buổi phát.
    const nguon = loai === 'livestream' ? ves.filter((t) => laVeTrucTuyen(t.accessType)) : ves
    const theoBuoi = new Map()
    for (const t of nguon) if (!theoBuoi.has(t.showId)) theoBuoi.set(t.showId, { id: t.showId, nhan: `${t.showName} · ${t.loungeName} · ${ngayDayDu(t.showScheduledStart)}` })
    return [...theoBuoi.values()]
  }
  if (loai === 'donation') {
    return mang(await getMyDonations({ page: 1, pageSize: 50 })).map((d) => ({ id: d.id, nhan: `${tien(d.gross)} cho ${d.performerName}${d.showName ? ` · ${d.showName}` : ''}` }))
  }
  if (loai === 'penalty' && user.role === 'Owner') {
    return mang(await getMyPenalties({ page: 1, pageSize: 50 })).map((p) => ({ id: p.id, nhan: `${TEN_AN[p.penaltyType] ?? p.penaltyType} · ${p.loungeName ?? ''} · ${ngayDayDu(p.issuedAt)}` }))
  }
  return []
}

const GOI_Y_DAN = {
  show: 'Dán đường dẫn trang buổi diễn (…/shows/…).',
  venue: 'Dán đường dẫn trang phòng trà (…/lounge/…).',
  ticket: 'Dán đường dẫn trang vé (…/my-shows/ticket/…).',
  livestream: 'Dán đường dẫn trang xem trực tuyến (…/livestream/…).',
  donation: 'Dán đường dẫn hoặc mã khoản ủng hộ trong sao kê của nghệ sĩ.',
  penalty: 'Dán mã án phạt.',
}

/** p: thuộc tính ô nhập do OTruong cấp (id, aria-*). */
export default function ChonDoiTuongKhieuNai({ loai, giaTri, onChon, user, p }) {
  const [ds, setDs] = useState(null) // null = đang tải
  const [danTay, setDanTay] = useState(false)
  const [chuDan, setChuDan] = useState('')

  useEffect(() => {
    let huy = false
    taiLuaChon(loai, user).catch(() => []).then((kq) => { if (!huy) setDs(kq) })
    return () => { huy = true }
  }, [loai, user])

  const coDs = Array.isArray(ds) && ds.length > 0
  const hienODan = !coDs || danTay

  return (
    <div className="space-y-2">
      {ds === null && <p className="text-sm text-ink-mute">Đang tải danh sách…</p>}
      {coDs && (
        // Khi đang dán, nhãn/aria (id) chuyển sang ô dán — nhưng ô chọn vẫn giữ kiểu ô (className), nếu không nó mất
        // viền và tràn khỏi khung (thấy trên trình duyệt 06/10).
        <select {...(hienODan ? { className: p.className, 'aria-label': 'Chọn trong danh sách hoặc dán đường dẫn' } : p)} value={danTay ? DAN : giaTri || ''}
          onChange={(e) => {
            if (e.target.value === DAN) { setDanTay(true); onChon(layMa(chuDan)) } else { setDanTay(false); onChon(e.target.value) }
          }}>
          <option value="">— chọn trong danh sách của bạn —</option>
          {ds.map((x) => <option key={x.id} value={x.id}>{x.nhan}</option>)}
          <option value={DAN}>Không có trong danh sách — dán đường dẫn</option>
        </select>
      )}
      {ds !== null && hienODan && (
        <>
          <input {...p} value={chuDan} spellCheck={false} autoComplete="off" placeholder={GOI_Y_DAN[loai] ?? 'Dán đường dẫn trang'}
            onChange={(e) => { setChuDan(e.target.value); onChon(layMa(e.target.value)) }} />
          {chuDan && (layMa(chuDan)
            ? <p className="text-sm text-success">Đã nhận ra {loai === 'venue' ? 'phòng trà' : 'đối tượng'} trong đường dẫn.</p>
            : <p className="text-sm text-ink-mute">Chưa thấy mã trong đường dẫn này — hãy dán nguyên đường dẫn từ thanh địa chỉ.</p>)}
        </>
      )}
    </div>
  )
}
