// src/components/program/GoiYChoBan.jsx
//
// DÀNH CHO BẠN / ĐANG ĐƯỢC QUAN TÂM (trang chủ, 03/10/2026) — chủ dự án: "phải có thành phần hiển thị các buổi biểu diễn được
// cá nhân hoá theo dữ liệu người dùng khi đăng nhập; còn guest thì hiển thị các buổi đang thịnh hành".
// Nghiên cứu + luật: reports/Trang chủ - gợi ý cá nhân và thịnh hành.md (repo backend).
//
// NGUỒN: GET /recommendations (đã có ở backend, trước đây chỉ ô gợi ý thanh tìm kiếm dùng). Máy chủ tự chọn mức:
//  đã đăng nhập → sở thích tự khai + phòng trà theo dõi (+ lọc cộng tác ML.NET nếu đã đồng ý AI); khách → buổi vừa xem
//  trên máy này (`recentShowIds`, utils/buoiVuaXem.js) hoặc bảng thịnh hành (vé bán + lượt lưu gần đây).
//
// LUẬT (chủ dự án chọn phương án A):
//  - VỊ TRÍ: ngay sau "Sắp lên đèn" — hai khối buổi diễn liền nhau, hai lăng kính: thời gian (gần nhất) rồi gu/xã hội.
//  - MỖI BUỔI MỘT LẦN: loại mọi buổi đã in ở khối trên (`loaiTru`: Đêm nay + Sắp lên đèn). Netflix: lặp tựa giữa các hàng
//    là lỗi bị phê bình. Còn 0 buổi → không in khối (không in khối rỗng).
//  - NHÃN NÓI THẬT (NN/g recommendation expectations; cold start: "đừng giả phổ biến là cá nhân hoá"): tiêu đề "Dành cho
//    bạn" CHỈ khi ít nhất một buổi được máy chủ xếp theo gu thật; toàn "Đang thịnh hành" thì tiêu đề "Đang được quan tâm".
//  - MỖI DÒNG IN LÝ DO đúng chuỗi backend trả.
//  - "Vì sao tôi thấy những buổi này?": nói rõ tiêu chí (tinh thần DSA Điều 27) + chỗ đổi ngay tại đây: "Chỉnh gu"
//    (/account?tab=preferences) hoặc với khách "Xoá lịch sử xem trên máy này".
//  - Đã đăng nhập mà máy chủ chỉ có bảng thịnh hành (chưa chọn gu) → mời "Chọn gu để có gợi ý riêng".
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import DongBuoiDien from './DongBuoiDien'
import IconMoRong from '../shared/IconMoRong'
import { getRecommendedShows } from '../../services/showServices'
import { docBuoiVuaXem, xoaBuoiVuaXem } from '../../utils/buoiVuaXem'

const LY_DO_THINH_HANH = 'Đang thịnh hành'
const SO_HIEN = 4

const GoiYChoBan = ({ daDangNhap = false, loaiTru = [], anhPhongTra = {}, className = '', idTieuDe = 'goi-y-cho-ban' }) => {
  const id = useId()
  const [ds, setDs] = useState(null) // null = đang tải
  const [lanTai, setLanTai] = useState(0)
  const [moVis, setMoVis] = useState(false)
  const coLichSu = !daDangNhap && docBuoiVuaXem().length > 0

  useEffect(() => {
    let huy = false
    const vuaXem = daDangNhap ? [] : docBuoiVuaXem()
    getRecommendedShows({ limit: SO_HIEN + 6, ...(vuaXem.length ? { recentShowIds: vuaXem } : {}) })
      .then((res) => { if (!huy) setDs(res?.success ? res.data ?? [] : []) })
      .catch(() => { if (!huy) setDs([]) }) // khối phụ: lỗi thì ẩn, không chặn trang chủ
    return () => { huy = true }
  }, [daDangNhap, lanTai])

  if (!ds) return null
  const boQua = new Set(loaiTru)
  const hien = ds.filter((b) => !boQua.has(b.id)).slice(0, SO_HIEN)
  if (hien.length === 0) return null

  const laCaNhan = (b) => b.recommendationReason && b.recommendationReason !== LY_DO_THINH_HANH
  // Tiêu đề theo những buổi THẬT SỰ hiện ra; lời mời chọn gu theo TOÀN BỘ kết quả máy chủ trả (trước khi loại trùng): đo
  // 03/10 — tài khoản có lịch sử quan tâm, buổi hợp gu bị loại vì đã ở "Sắp lên đèn", còn lại buổi thịnh hành → bản đầu
  // mời "bạn chưa chọn gu", sai với người đó.
  const tieuDe = hien.some(laCaNhan) ? 'Dành cho bạn' : 'Đang được quan tâm'
  const moiChonGu = daDangNhap && !ds.some(laCaNhan)

  return (
    <section aria-labelledby={idTieuDe} className={className}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3 mb-2">
        <h2 id={idTieuDe} className="text-4xl sm:text-5xl text-ink">{tieuDe}</h2>
        <button type="button" onClick={() => setMoVis((v) => !v)} aria-expanded={moVis} aria-controls={`${id}-vi-sao`}
          className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-ink hover:text-board">
          <IconMoRong mo={moVis} /> Vì sao tôi thấy những buổi này?
        </button>
      </div>

      {moVis && (
        <div id={`${id}-vi-sao`} className="border-2 border-ink bg-card p-4 sm:p-5 mb-4 text-ink-soft space-y-2">
          {daDangNhap ? (
            <p>Xếp theo <b className="text-ink">gu bạn đã chọn</b> và <b className="text-ink">phòng trà bạn theo dõi</b>
              {' '}(nếu bạn đã đồng ý cho MusicLounge dùng AI, có thêm những buổi người cùng gu đã chọn). Chưa có gì để dựa vào thì xếp theo độ quan tâm chung.</p>
          ) : (
            <p>Bạn chưa đăng nhập: xếp theo <b className="text-ink">những buổi bạn vừa xem trên máy này</b> (chỉ lưu trong trình duyệt của bạn, không gửi lưu ở máy chủ); chưa xem gì thì xếp theo độ quan tâm chung.</p>
          )}
          <p><b className="text-ink">Đang thịnh hành</b> = nhiều vé bán và lượt lưu yêu thích gần đây. Không có buổi nào được trả tiền để lên đây.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1">
            {daDangNhap
              ? <Link to="/account?tab=preferences" className="font-semibold text-ink underline underline-offset-4 min-h-[44px] inline-flex items-center">Chỉnh gu của bạn</Link>
              : <Link to="/login" className="font-semibold text-ink underline underline-offset-4 min-h-[44px] inline-flex items-center">Đăng nhập để có gợi ý theo gu</Link>}
            {coLichSu && (
              <button type="button" onClick={() => { xoaBuoiVuaXem(); setLanTai((n) => n + 1) }} className="font-semibold text-ink underline underline-offset-4 min-h-[44px]">
                Xoá lịch sử xem trên máy này
              </button>
            )}
          </div>
        </div>
      )}

      {moiChonGu && (
        <p className="text-ink-soft mb-2">
          Chưa có gợi ý riêng vì bạn chưa chọn gu. <Link to="/account?tab=preferences" className="font-semibold text-ink underline underline-offset-4">Chọn gu để có gợi ý riêng</Link>
        </p>
      )}

      <ol>
        {hien.map((b) => (
          <DongBuoiDien key={b.id} b={b} anhDuPhong={anhPhongTra[b.loungeName] ?? null} lyDo={b.recommendationReason || null} />
        ))}
      </ol>
    </section>
  )
}

export default GoiYChoBan
