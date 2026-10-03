// src/components/program/DemDaQua.jsx
//
// ĐÊM ĐÃ QUA (trang chủ) — lời khán giả THẬT của các đêm đã diễn. Đây là bằng chứng xã hội ("người như tôi đã đi và
// thích") — cảm hứng phần ảnh + đánh giá của Candlelight (reports/Trang chủ - buổi diễn nổi bật.md).
//
// 03/10/2026 (bản 2): thành BĂNG LƯỚT, mỗi lượt một lời (BangLuotLoiBinh) — chủ dự án: "mỗi review 1 ảnh, có thể lướt
// qua lại, có thể có ảnh hoặc không". Bản 1 in 3 lời cạnh xấp ảnh Polaroid của phòng trà; đo với một đêm 237 lời thì cả 3
// lời cùng một đêm, có lời 1 sao, lời dài không cắt, đường dẫn dài làm vỡ trang. Luật chọn lời nay ở utils/demDaQua.js.
//
// - CHỈ in khi có ít nhất một lời đạt luật. Không bịa lời, không in "★ 0", không có chữ mẫu.
// - Tên người đánh giá in như trang buổi diễn (ShowRatings: userName || 'Khán giả') — cùng một quy ước.
// - ẢNH của mỗi lượt: ảnh khán giả đính kèm đánh giá (`imageUrl` — backend 03/10/2026 CHƯA có trường này) → ảnh bìa đêm
//   diễn → ảnh đại diện phòng trà; chú thích ghi rõ nguồn (xem BangLuotLoiBinh). Có `imageUrl` thì băng tự dùng.
// GIỚI HẠN ĐÃ BIẾT: backend chỉ có đánh giá THEO TỪNG BUỔI (GET /lounge-shows/{id}/ratings) → gọi lịch theo từng phòng
// trà rồi đánh giá theo từng đêm đã diễn (tối đa SO_DEM_XET đêm gần nhất, mỗi đêm SO_LOI_MOI_DEM lời mới nhất). Trần: vài
// chục đêm. Đường nâng cấp: một API "lời bình tiêu biểu" ở backend trả thẳng N lời đã chọn kèm tên buổi/phòng trà.
// GIỚI HẠN TẦN SUẤT (đo 03/10/2026): backend chặn 100 yêu cầu/phút/IP. Nên: (1) chỉ tải khi khối sắp vào màn hình;
// (2) nhớ kết quả 5 phút trong sessionStorage (tiện ích từng người xem — mất thì tải lại, không sai).
import { useEffect, useRef, useState } from 'react'
import { getShowsByLounge, getShowRatings } from '../../services/showServices'
import { chonLoiDemDaQua } from '../../utils/demDaQua'
import BangLuotLoiBinh from './BangLuotLoiBinh'

const SO_DEM_XET = 12
const SO_LOI_MOI_DEM = 20
const KHOA_NHO = 'ml-dem-da-qua-v3'
const NHO_MS = 5 * 60 * 1000
const docNho = () => { try { const v = JSON.parse(sessionStorage.getItem(KHOA_NHO)); return v && Date.now() - v.luc < NHO_MS ? v.duLieu : null } catch { return null } }
const ghiNho = (duLieu) => { try { sessionStorage.setItem(KHOA_NHO, JSON.stringify({ luc: Date.now(), duLieu })) } catch { /* trình duyệt chặn lưu — bỏ qua */ } }

// `dau` (tiêu đề khối) do trang truyền vào và chỉ in CÙNG nội dung: không có lời nào thì cả khối biến mất, không để lại tiêu đề trơ.
const DemDaQua = ({ phongTra = [], dau = null, className = '' }) => {
  const [duLieu, setDuLieu] = useState(docNho) // null = chưa tải; { loi: [] }
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
        .filter((b) => b.status === 'Ended')
        .map((b) => ({ id: b.id, name: b.name, scheduledStart: b.scheduledStart, coverImageUrl: b.coverImageUrl ?? null, phongTra: { id: phongTra[i].id, name: b.loungeName || phongTra[i].name, anh: phongTra[i].primaryImageUrl ?? null } })))
        .sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart)).slice(0, SO_DEM_XET)
      const dg = await Promise.allSettled(daDien.map((b) => getShowRatings(b.id, { page: 1, pageSize: SO_LOI_MOI_DEM })))
      const kq = { loi: chonLoiDemDaQua(daDien.map((buoi, i) => ({ buoi, danhGia: dg[i].status === 'fulfilled' && dg[i].value?.success ? dg[i].value.data?.items?.items ?? [] : [] }))) }
      ghiNho(kq)
      if (!huy) setDuLieu(kq)
    }
    tai().catch(() => { if (!huy) setDuLieu({ loi: [] }) })
    return () => { huy = true }
  }, [gan, duLieu, phongTra])

  // Mốc vô hình để biết khi nào sắp cuộn tới — chưa có dữ liệu thì chỉ in mốc, không in tiêu đề trơ.
  if (!duLieu) return <div ref={moc} aria-hidden="true" />
  if (duLieu.loi.length === 0) return null

  return (
    <section aria-labelledby="dem-da-qua" className={className}>
      {dau}
      <BangLuotLoiBinh loi={duLieu.loi} />
    </section>
  )
}

export default DemDaQua
