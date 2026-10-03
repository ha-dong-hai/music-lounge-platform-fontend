// src/components/program/DemDaQua.jsx
//
// ĐÊM ĐÃ QUA (trang chủ, 03/10/2026) — lời khán giả THẬT của các đêm đã diễn, cạnh xấp ảnh Polaroid thật của phòng trà.
// Đây là bằng chứng xã hội ("người như tôi đã đi và thích") — cảm hứng phần ảnh + đánh giá của Candlelight
// (reports/Trang chủ - buổi diễn nổi bật.md). Dùng lại vẻ Polaroid đã có (XapPolaroid, MLACP-539).
//
// - CHỈ in khi có ít nhất một đánh giá CÓ LỜI BÌNH. Không bịa lời, không in "★ 0", không có chữ mẫu.
//   Azure 03/10/2026: 9 đêm đã diễn, 1 đánh giá có lời.
// - Tên người đánh giá in như trang buổi diễn (ShowRatings: userName || 'Khán giả') — cùng một quy ước.
// GIỚI HẠN ĐÃ BIẾT: backend chỉ có đánh giá THEO TỪNG BUỔI (GET /lounge-shows/{id}/ratings) → gọi lịch theo từng phòng
// trà rồi đánh giá theo từng đêm đã diễn (tối đa SO_DEM_XET đêm gần nhất). Trần: vài chục đêm. Đường nâng cấp: một API
// "đánh giá công khai gần đây" ở backend trả thẳng N lời mới nhất kèm tên buổi/phòng trà.
// GIỚI HẠN TẦN SUẤT (đo 03/10/2026): backend chặn 100 yêu cầu/phút/IP. Bản đầu tải khối này ngay khi mở trang + gọi chi
// tiết cả 5 phòng trà → trang chủ 31 yêu cầu/lần (dev), tải lại 3 lần là 429 và "Sắp lên đèn" mất câu giới thiệu, số vé.
// Nay: (1) chỉ tải khi khối sắp vào màn hình; (2) nhớ kết quả 5 phút trong sessionStorage (tiện ích từng người xem — mất
// thì tải lại, không sai); (3) chỉ lấy thư viện ảnh của MỘT phòng trà (nơi có lời đầu tiên).
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getShowsByLounge, getShowRatings } from '../../services/showServices'
import { getLoungeDetail } from '../../services/loungeServices'
import { ngayDayDu } from '../../utils/ngayVietNam'

const SO_DEM_XET = 12
const SO_LOI = 3
const XOAY = [-3, 2.5, -1.5, 3]
const KHOA_NHO = 'ml-dem-da-qua-v1'
const NHO_MS = 5 * 60 * 1000
const docNho = () => { try { const v = JSON.parse(sessionStorage.getItem(KHOA_NHO)); return v && Date.now() - v.luc < NHO_MS ? v.duLieu : null } catch { return null } }
const ghiNho = (duLieu) => { try { sessionStorage.setItem(KHOA_NHO, JSON.stringify({ luc: Date.now(), duLieu })) } catch { /* trình duyệt chặn lưu — bỏ qua */ } }

const Sao = ({ diem }) => (
  <span className="font-mono text-sm tracking-[0.15em] text-lamp">
    <span aria-hidden="true">{'★'.repeat(diem)}{'☆'.repeat(5 - diem)}</span>
    <span className="sr-only">{diem} trên 5 sao</span>
  </span>
)

// `dau` (tiêu đề khối) do trang truyền vào và chỉ in CÙNG nội dung: không có lời nào thì cả khối biến mất, không để lại tiêu đề trơ.
const DemDaQua = ({ phongTra = [], dau = null, className = '' }) => {
  const [duLieu, setDuLieu] = useState(docNho) // null = chưa tải; { loi: [], anh: [] }
  const [gan, setGan] = useState(false)
  const moc = useRef(null)

  useEffect(() => {
    const el = moc.current
    if (!el || gan || duLieu) return undefined
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGan(true); io.disconnect() } }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [gan, duLieu])

  useEffect(() => {
    if (!gan || duLieu || phongTra.length === 0) return undefined
    let huy = false
    const tai = async () => {
      const lich = await Promise.allSettled(phongTra.map((l) => getShowsByLounge(l.id, { page: 1, pageSize: 50 })))
      const daDien = lich.flatMap((r, i) => (r.status === 'fulfilled' && r.value?.success ? r.value.data?.items ?? [] : [])
        .filter((b) => b.status === 'Ended').map((b) => ({ ...b, phongTra: phongTra[i] })))
        .sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart)).slice(0, SO_DEM_XET)
      const dg = await Promise.allSettled(daDien.map((b) => getShowRatings(b.id, { page: 1, pageSize: 5 })))
      const ds = dg.flatMap((r, i) => (r.status === 'fulfilled' && r.value?.success ? r.value.data?.items?.items ?? [] : [])
        .filter((x) => x.comment?.trim()).map((x) => ({ ...x, buoi: daDien[i] })))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, SO_LOI)
      // Ảnh: thư viện của phòng trà có lời đầu tiên (đúng nơi người ta đã ngồi) — một lượt gọi, không phải cả 5 phòng trà.
      let anh = []
      if (ds.length > 0) {
        const ct = await getLoungeDetail(ds[0].buoi.phongTra.id).catch(() => null)
        anh = (ct?.success ? ct.data?.galleryImages ?? [] : []).slice().sort((a, b) => a.orderIndex - b.orderIndex)
          .slice(0, 4).map((g) => ({ url: g.imageUrl, chuThich: g.caption }))
      }
      const kq = { loi: ds.map(({ buoi, ...r }) => ({ ...r, buoi: { id: buoi.id, name: buoi.name, scheduledStart: buoi.scheduledStart, phongTra: { id: buoi.phongTra.id, name: buoi.phongTra.name } } })), anh }
      ghiNho(kq)
      if (!huy) setDuLieu(kq)
    }
    tai().catch(() => { if (!huy) setDuLieu({ loi: [], anh: [] }) })
    return () => { huy = true }
  }, [gan, duLieu, phongTra])

  // Mốc vô hình để biết khi nào sắp cuộn tới — chưa có dữ liệu thì chỉ in mốc, không in tiêu đề trơ.
  if (!duLieu) return <div ref={moc} aria-hidden="true" />
  const { loi, anh } = duLieu
  if (loi.length === 0) return null

  return (
    <section aria-labelledby="dem-da-qua" className={className}>
    {dau}
    <div className="bg-board text-lamp p-5 sm:p-8 lg:p-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center">
      {anh.length > 0 && (
        <div aria-hidden="true" className="flex flex-wrap justify-center gap-6 py-2">
          {anh.map((a, i) => (
            <figure key={a.url} className="m-0 bg-card text-ink p-2.5 pb-3 w-[min(44%,13rem)] shadow-[0_8px_18px_rgb(0_0_0/0.35)]" style={{ transform: `rotate(${XOAY[i % XOAY.length]}deg)` }}>
              <div className="aspect-square overflow-hidden"><img src={a.url} alt="" loading="lazy" width="320" height="320" className="w-full h-full object-cover" /></div>
              {a.chuThich && <figcaption className="font-hand text-[15px] leading-tight mt-2 line-clamp-2">{a.chuThich}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      <ul className={`space-y-8 ${anh.length === 0 ? 'lg:col-span-2' : ''}`}>
        {loi.map((r) => (
          <li key={r.id}>
            <Sao diem={r.score} />
            <blockquote className="font-hand text-2xl leading-snug mt-2">“{r.comment.trim()}”</blockquote>
            <p className="text-sm text-lamp-mute mt-2">
              — {r.userName || 'Khán giả'} · <Link to={`/shows/${r.buoi.id}`} className="underline underline-offset-2 hover:text-lamp">{r.buoi.name}</Link> · {r.buoi.phongTra.name} · {ngayDayDu(r.buoi.scheduledStart)}
            </p>
          </li>
        ))}
      </ul>
    </div>
    </section>
  )
}

export default DemDaQua
