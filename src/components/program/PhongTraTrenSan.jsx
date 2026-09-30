// src/components/program/PhongTraTrenSan.jsx
//
// PHÒNG TRÀ TRÊN SÀN — khối KHÔNG BAO GIỜ TRỐNG của trang chủ (venue-first 23/09 §7.1 khối 3): phòng trà luôn tồn
// tại kể cả đêm không ai hát. Mỗi phòng trà in như một ô chương trình trên giấy: ảnh không gian thật
// (`primaryImageUrl`), tên chữ khối, quận, số đêm diễn sắp tới (`upcomingShowCount` — con số DỒI DÀO, không phải
// khan hiếm), nút Theo dõi NGAY TRÊN THẺ (hành động được chứng minh mạnh nhất trong nghiên cứu: Songkick).
// Phòng trà có diễn đêm nay thì ô đó "sáng đèn" (khối mực, chữ sáng) — cùng tín hiệu với bảng giờ diễn.
// Chưa đăng nhập mà bấm Theo dõi: nói trước là cần đăng nhập (nguyên tắc 6) — nút ghi rõ và dẫn tới /login.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MapPin } from 'lucide-react'
import CoverFallback from '../shared/CoverFallback'
import { getLounges } from '../../services/loungeServices'
import { toggleFollowLounge, getFollowedLounges } from '../../services/interactionServices'

const PhongTraTrenSan = ({ daDangNhap, phongTraSangDen = new Set(), onTai }) => {
  const [ds, setDs] = useState(null) // null = đang tải
  const [loi, setLoi] = useState(false)
  const [dangTheoDoi, setDangTheoDoi] = useState(new Set())
  const [dangBam, setDangBam] = useState(null)
  const [lanTai, setLanTai] = useState(0)

  useEffect(() => {
    let huy = false
    getLounges({ page: 1, pageSize: 8 })
      .then((res) => {
        if (huy) return
        const items = res.success ? res.data?.items ?? [] : []
        setDs(items); setLoi(false); onTai?.(items)
      })
      .catch(() => { if (!huy) { setLoi(true); setDs([]) } })
    return () => { huy = true }
  }, [lanTai, onTai])

  useEffect(() => {
    if (!daDangNhap) return
    getFollowedLounges({ page: 1, pageSize: 100 })
      .then((res) => {
        const items = res.success ? res.data?.items ?? res.data ?? [] : []
        setDangTheoDoi(new Set(items.map((x) => x.id ?? x.loungeId)))
      })
      .catch(() => {}) // không đọc được thì nút hiện "Theo dõi" — máy chủ vẫn là nơi quyết định
  }, [daDangNhap])

  const batTat = async (lounge) => {
    const dang = dangTheoDoi.has(lounge.id)
    setDangBam(lounge.id)
    try {
      await toggleFollowLounge(lounge.id, dang)
      setDangTheoDoi((cu) => { const m = new Set(cu); dang ? m.delete(lounge.id) : m.add(lounge.id); return m })
      toast.success(dang ? `Đã bỏ theo dõi ${lounge.name}.` : `Đã theo dõi ${lounge.name} — bạn sẽ được báo khi có đêm diễn mới.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không cập nhật được theo dõi.')
    } finally { setDangBam(null) }
  }

  if (ds === null) {
    return (
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Đang tải danh sách phòng trà">
        {[0, 1, 2, 3].map((i) => <li key={i} className="h-80 border-2 border-ink/20 bg-ink/5 animate-pulse" />)}
      </ul>
    )
  }
  if (loi) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
        <p>Danh sách phòng trà chưa tải được.</p>
        <button type="button" onClick={() => setLanTai((n) => n + 1)} className="min-h-[44px] px-5 bg-ink text-lamp font-semibold">Thử lại</button>
      </div>
    )
  }
  if (ds.length === 0) {
    return <p className="border-2 border-ink p-5">Sàn chưa có phòng trà nào được duyệt.</p>
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {ds.map((l) => {
        const sangDen = phongTraSangDen.has(l.name)
        const theoDoi = dangTheoDoi.has(l.id)
        return (
          <li key={l.id} className={`flex flex-col border-2 border-ink ${sangDen ? 'bg-ink text-lamp shadow-glow' : 'bg-stock text-ink'}`}>
            <Link to={`/lounge/${l.id}`} className="block m-3 mb-0 aspect-[4/3] overflow-hidden border border-ink bg-board">
              {l.primaryImageUrl ? <img src={l.primaryImageUrl} alt={`Không gian ${l.name}`} loading="lazy" className="w-full h-full object-cover" /> : <CoverFallback />}
            </Link>
            <div className="flex flex-col gap-2 p-4 flex-1">
              <Link to={`/lounge/${l.id}`} className={`font-display text-3xl leading-none hover:underline ${sangDen ? 'text-lamp' : 'text-ink'}`}>{l.name}</Link>
              <p className={`flex items-center gap-1 text-sm ${sangDen ? 'text-lamp-mute' : 'text-ink-soft'}`}>
                <MapPin size={13} aria-hidden="true" /> {[l.district, l.city].filter(Boolean).join(', ') || '—'}
              </p>
              <p className={`font-mono text-sm ${sangDen ? 'text-lamp' : 'text-ink'}`}>
                {sangDen ? 'Có diễn đêm nay' : l.upcomingShowCount > 0 ? `${l.upcomingShowCount} đêm diễn sắp tới` : 'Chưa có đêm diễn mới'}
              </p>
              <div className="mt-auto pt-2">
                {daDangNhap ? (
                  <button type="button" onClick={() => batTat(l)} disabled={dangBam === l.id} aria-pressed={theoDoi}
                    className={`w-full min-h-[44px] border-2 font-semibold transition-colors disabled:opacity-60 ${sangDen
                      ? (theoDoi ? 'bg-lamp text-ink border-lamp' : 'border-lamp text-lamp hover:bg-lamp hover:text-ink')
                      : (theoDoi ? 'bg-ink text-lamp border-ink' : 'border-ink text-ink hover:bg-ink hover:text-lamp')}`}>
                    {theoDoi ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                ) : (
                  <Link to="/login" state={{ from: '/' }}
                    className={`flex items-center justify-center w-full min-h-[44px] border-2 font-semibold ${sangDen ? 'border-lamp text-lamp' : 'border-ink text-ink'}`}>
                    Đăng nhập để theo dõi
                  </Link>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default PhongTraTrenSan
