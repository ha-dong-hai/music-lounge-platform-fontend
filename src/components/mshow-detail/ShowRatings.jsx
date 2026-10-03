// src/components/mshow-detail/ShowRatings.jsx
//
// KHI NHIỀU DỮ LIỆU (đo 03/10/2026, giả lập 237 đánh giá, bình luận tới 1.000 ký tự = giới hạn cột Comment):
//   - Chuỗi không dấu cách (đường dẫn, "aaaa…") đẩy CẢ TRANG trên điện thoại 390px cuộn ngang tới 1.286px
//     → ngắt ở bất kỳ đâu khi cần (overflow-wrap: anywhere).
//   - Xuống dòng người viết gõ bị gộp thành một đoạn → giữ xuống dòng (white-space: pre-line).
//   - Bấm "Sau": cả khối thay bằng vòng xoay, trang co từ ~3.170px xuống ~1.740px nên vị trí đọc nhảy
//     → giữ danh sách cũ (mờ đi, aria-busy) tới khi trang mới về, rồi đưa đầu danh sách vào tầm nhìn.
//   - 24 trang chỉ có Trước/Sau → dùng PhanTrang chung (dải số kiểu GOV.UK, dòng "Hiện 11–20 trên 237 đánh giá"); trang
//     nằm trên địa chỉ (?dgTrang=) qua useDanhSachMayChu nên Quay lại về đúng trang, và dữ liệu cũ giữ tới khi trang mới về.
//   - Bình luận 1.000 ký tự cao 662px trên điện thoại → thu gọn 5 dòng + "Xem thêm" (chỉ khi thật sự bị cắt).
import { useState, useRef, useLayoutEffect, useMemo } from 'react'

import { Loader2, Star, MessageSquare, Trash2, X } from 'lucide-react'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../bang/PhanTrang'
import { ngayDayDu } from '../../utils/ngayVietNam'
import toast from 'react-hot-toast'
import { getShowRatings } from '../../services/showServices'
import { removeRating } from '../../services/adminServices'
import { useAuthStore } from '../../store/useAuthStore'
import HopThoai, { TieuDeHop } from '../shared/HopThoai'

// Chữ do khán giả gõ: giữ xuống dòng của họ, và ngắt được cả chuỗi dài không dấu cách (đường dẫn) để không tràn khung.
const CHU_NGUOI_VIET = 'whitespace-pre-line [overflow-wrap:anywhere]'

const SaoHang = ({ score, size = 14 }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${score} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={size}
        className={i <= score ? 'text-ink fill-ink' : 'text-ink-mute'} />
    ))}
  </span>
)

// Hộp thoại nhập lý do gỡ. Tách riêng vì `reason` bắt buộc: không thể gỡ bằng một cú bấm.
const RemoveModal = ({ rating, onClose, onDone }) => {
  const [reason, setReason] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) { toast.error('Cần ghi lý do gỡ đánh giá.'); return }
    setIsBusy(true)
    try {
      await removeRating(rating.id, reason.trim())
      toast.success('Đã gỡ đánh giá.')
      onDone()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gỡ được đánh giá.')
    } finally { setIsBusy(false) }
  }

  return (
    <HopThoai onDong={onClose} className="max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <TieuDeHop><h2 className="text-3xl text-ink">Gỡ đánh giá này?</h2></TieuDeHop>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-sunken text-ink-soft disabled:opacity-30" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="p-3 bg-sunken/80 border border-line">
            <SaoHang score={rating.score} />
            {rating.comment && <p className={`text-sm text-ink-soft mt-1.5 leading-relaxed ${CHU_NGUOI_VIET}`}>{rating.comment}</p>}
          </div>
          <div>
            <label className="text-xs text-ink-mute">Lý do gỡ <span className="text-danger">*</span></label>
            <textarea aria-label="Lý do gỡ" rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="VD: nội dung xúc phạm, không liên quan tới buổi diễn"
              className="mt-1 w-full px-3 py-2 bg-page border border-line text-sm text-ink resize-none focus:outline-none focus:border-ink/50" />
            <p className="text-xs text-ink-mute mt-1 leading-relaxed">
              Gỡ xong đánh giá không còn tính vào điểm trung bình. Lý do được lưu lại.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft font-medium hover:bg-sunken disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 py-2.5 bg-danger text-lamp font-bold hover:bg-danger flex items-center justify-center gap-2 disabled:opacity-50">
              {isBusy && <Loader2 size={16} className="animate-spin" />} Gỡ đánh giá
            </button>
          </div>
        </form>
      </HopThoai>
  )
}

// Bình luận dài: kẹp 5 dòng, nút "Xem thêm" CHỈ hiện khi chữ thật sự bị cắt (đo scrollHeight, không đoán theo số ký tự —
// 300 ký tự có xuống dòng có thể dài hơn 600 ký tự liền).
const BinhLuan = ({ chu }) => {
  const [mo, setMo] = useState(false)
  // 'do' = đang đo (đang kẹp); 'cat' = phần giấu dài > 2 dòng → giữ kẹp + nút; 'du' = in hết, không cần nút.
  const [kieu, setKieu] = useState('do')
  const biCat = kieu === 'cat'
  const p = useRef(null)
  useLayoutEffect(() => {
    const el = p.current
    if (!el || mo || kieu === 'du') return undefined
    // Chỉ thu gọn khi phần bị giấu dài hơn 2 dòng: giấu 1–2 dòng sau một nút "Xem thêm" phiền hơn là in luôn (đo 03/10:
    // bình luận 1.000 ký tự ở màn 1440px chỉ dư 1 dòng, bấm "Xem thêm" ra thêm 23px).
    const do_ = () => {
      const dong = Number.parseFloat(getComputedStyle(el).lineHeight) || 20
      setKieu(el.scrollHeight - el.clientHeight > dong * 2 ? 'cat' : 'du')
    }
    do_()
    const ro = new ResizeObserver(do_)
    ro.observe(el)
    return () => ro.disconnect()
  }, [chu, mo, kieu])
  return (
    <>
      <p ref={p} className={`text-sm text-ink-soft mt-2 leading-relaxed ${CHU_NGUOI_VIET} ${mo || kieu === 'du' ? '' : 'line-clamp-5'}`}>{chu}</p>
      {(biCat || mo) && (
        <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo}
          className="mt-1 min-h-[44px] text-sm font-semibold text-ink underline underline-offset-4">
          {mo ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </>
  )
}

// Đáp án của GET /lounge-shows/{id}/ratings lồng hai tầng: { averageScore, totalCount, scoreDistribution, items: { items,
// page, … } }. Trải tầng trong ra cho useDanhSachMayChu đọc trang/tổng, giữ phần tổng quan ở `tongQuan`.
const goiDanhGia = (showId) => async ({ page, pageSize }) => {
  const res = await getShowRatings(showId, { page, pageSize })
  if (!res?.success) return res
  const { items: trangDg, ...tongQuan } = res.data ?? {}
  return { ...res, data: { ...(trangDg ?? {}), tongQuan } }
}

const ID_DS = 'ds-danh-gia'

const ShowRatings = ({ showId }) => {
  const role = useAuthStore((s) => s.user?.role)
  const laAdmin = role === 'Admin'
  const [removing, setRemoving] = useState(null)
  const goi = useMemo(() => goiDanhGia(showId), [showId])
  const ds = useDanhSachMayChu({ khoa: ['danh-gia-buoi', showId], goi, coMacDinh: 10, cacCo: [10], tien: 'dg' })
  const data = ds.duLieu?.tongQuan ?? null

  if (ds.dangTai) {
    return <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-ink" /></div>
  }
  if (ds.loi && !data) {
    return (
      <div className="bg-card border border-line p-8 text-center">
        <p className="font-semibold text-ink">Chưa tải được đánh giá.</p>
        <button type="button" onClick={() => ds.taiLai()} className="mt-3 min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
      </div>
    )
  }

  if (!data || data.totalCount === 0) {
    return (
      <div className="bg-card border border-line p-12 text-center">
        <MessageSquare size={30} className="mx-auto mb-3 text-ink-mute" />
        <p className="text-base font-semibold text-ink mb-1">Chưa có đánh giá nào</p>
        <p className="text-sm text-ink-mute">Đánh giá xuất hiện sau khi buổi diễn kết thúc.</p>
      </div>
    )
  }

  const phanBo = data.scoreDistribution ?? {}

  return (
    <div className="space-y-5">
      {/* TỔNG QUAN — số của backend tính trên toàn bộ đánh giá, không phải trang đang xem */}
      <div className="bg-card border border-line p-6 flex flex-col sm:flex-row gap-8">
        <div className="text-center sm:text-left flex-shrink-0">
          <p className="text-4xl font-bold text-ink tabular-nums">
            {data.averageScore != null
              ? Number(data.averageScore).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
              : '—'}
          </p>
          <div className="mt-1.5 flex justify-center sm:justify-start">
            <SaoHang score={Math.round(Number(data.averageScore || 0))} size={16} />
          </div>
          <p className="text-xs text-ink-mute mt-1.5">{data.totalCount} đánh giá</p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((sao) => {
            // Khoá có thể thiếu khi không đánh giá nào ở mức đó — mặc định 0.
            const soLuong = Number(phanBo[sao] ?? phanBo[String(sao)] ?? 0)
            const tiLe = data.totalCount > 0 ? (soLuong / data.totalCount) * 100 : 0
            return (
              <div key={sao} className="flex items-center gap-3">
                <span className="text-xs text-ink-mute w-8 flex-shrink-0 tabular-nums">{sao} ★</span>
                <div className="flex-1 h-2 bg-sunken overflow-hidden">
                  <div className="h-full bg-ink" style={{ width: `${tiLe}%` }} />
                </div>
                <span className="text-xs text-ink-mute w-10 text-right flex-shrink-0 tabular-nums">{soLuong}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* NHẬN XÉT — tabIndex -1 để PhanTrang đưa tiêu điểm về đầu danh sách khi đổi trang */}
      <div id={ID_DS} tabIndex={-1} aria-busy={ds.laDuLieuCu || undefined}
        className={`bg-card border border-line divide-y divide-line scroll-mt-24 focus:outline-none transition-opacity ${ds.laDuLieuCu ? 'opacity-50' : ''}`}>
        {ds.items.map((r) => (
          <div key={r.id} className="p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink [overflow-wrap:anywhere]">{r.userName || 'Khán giả'}</p>
                <SaoHang score={r.score} />
              </div>
              {r.comment && <BinhLuan chu={r.comment} />}
              <p className="text-xs text-ink-mute mt-2">{ngayDayDu(r.createdAt)}</p>
            </div>
            {laAdmin && (
              <button onClick={() => setRemoving(r)} title="Gỡ đánh giá" aria-label="Gỡ đánh giá"
                className="p-2 text-ink-mute hover:bg-danger/10 hover:text-danger flex-shrink-0">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      <PhanTrang ds={ds} tenDonVi="đánh giá" idDanhSach={ID_DS} />

      {removing && (
        // Gỡ xong tải lại CẢ KHỐI: điểm trung bình và phân bố do backend tính, xoá dòng khỏi
        // state là hiển thị sai điểm.
        <RemoveModal rating={removing} onClose={() => setRemoving(null)} onDone={() => ds.taiLai()} />
      )}
    </div>
  )
}

export default ShowRatings