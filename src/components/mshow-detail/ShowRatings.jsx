// src/components/mshow-detail/ShowRatings.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Điểm trung bình và phân bố sao do BACKEND tính trên TOÀN BỘ đánh giá còn hiệu lực, không phải
//   trên trang đang xem. Đừng tính lại từ `items` — trang 2 sẽ ra số khác trang 1.
// - Đánh giá đã bị Admin gỡ thì không nằm trong danh sách và không tính vào điểm. Nghĩa là gỡ xong
//   phải tải lại cả khối, không chỉ xoá dòng khỏi state, nếu không điểm trung bình hiển thị sẽ lệch.
// - `averageScore` là null khi chưa có đánh giá nào — KHÔNG hiện 0.0 sao, vì 0 sao trông như bị
//   đánh giá tệ chứ không phải chưa ai đánh giá.
// - `userName` có thể null (người dùng đã xoá tài khoản / đánh giá ẩn danh) → hiện "Khán giả".
// - `scoreDistribution` là object khoá 1..5 dạng chuỗi; khoá nào không có đánh giá thì backend có
//   thể không trả khoá đó, nên phải mặc định 0 chứ không đọc thẳng.
// - Nút gỡ chỉ hiện với Admin. Ẩn nút không phải là bảo mật (backend vẫn chặn 403), nhưng hiện nút
//   không bấm được thì vô nghĩa. `reason` là BẮT BUỘC — backend từ chối nếu để trống.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Star, MessageSquare, Trash2, X } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getShowRatings } from '../../services/showServices'
import { removeRating } from '../../services/adminServices'
import { useAuthStore } from '../../store/useAuthStore'

const SaoHang = ({ score, size = 14 }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${score} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={size}
        className={i <= score ? 'text-[#C3B665] fill-[#C3B665]' : 'text-gray-700'} />
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Gỡ đánh giá này?</h2>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-black/50 border border-gray-800">
            <SaoHang score={rating.score} />
            {rating.comment && <p className="text-sm text-gray-300 mt-1.5 leading-relaxed">{rating.comment}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-500">Lý do gỡ <span className="text-red-400">*</span></label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="VD: nội dung xúc phạm, không liên quan tới buổi diễn"
              className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white resize-none focus:outline-none focus:border-[#C3B665]/50" />
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Gỡ xong đánh giá không còn tính vào điểm trung bình. Lý do được lưu lại.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50">
              {isBusy && <Loader2 size={16} className="animate-spin" />} Gỡ đánh giá
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ShowRatings = ({ showId }) => {
  const role = useAuthStore((s) => s.user?.role)
  const laAdmin = role === 'Admin'

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [removing, setRemoving] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getShowRatings(showId, { page, pageSize: 10 })
      if (res.success) setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được đánh giá.')
    } finally {
      setIsLoading(false)
    }
  }, [showId, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-[#C3B665]" /></div>
  }

  if (!data || data.totalCount === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
        <MessageSquare size={30} className="mx-auto mb-3 text-gray-700" />
        <p className="text-base font-semibold text-white mb-1">Chưa có đánh giá nào</p>
        <p className="text-sm text-gray-500">Đánh giá xuất hiện sau khi buổi diễn kết thúc.</p>
      </div>
    )
  }

  const phanBo = data.scoreDistribution ?? {}
  const items = data.items?.items ?? []
  const totalPages = data.items?.totalPages ?? 1

  return (
    <div className="space-y-5">
      {/* TỔNG QUAN — số của backend tính trên toàn bộ đánh giá, không phải trang đang xem */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row gap-8">
        <div className="text-center sm:text-left flex-shrink-0">
          <p className="text-4xl font-bold text-white tabular-nums">
            {data.averageScore != null
              ? Number(data.averageScore).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
              : '—'}
          </p>
          <div className="mt-1.5 flex justify-center sm:justify-start">
            <SaoHang score={Math.round(Number(data.averageScore || 0))} size={16} />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">{data.totalCount} đánh giá</p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((sao) => {
            // Khoá có thể thiếu khi không đánh giá nào ở mức đó — mặc định 0.
            const soLuong = Number(phanBo[sao] ?? phanBo[String(sao)] ?? 0)
            const tiLe = data.totalCount > 0 ? (soLuong / data.totalCount) * 100 : 0
            return (
              <div key={sao} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-8 flex-shrink-0 tabular-nums">{sao} ★</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C3B665] rounded-full" style={{ width: `${tiLe}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0 tabular-nums">{soLuong}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* NHẬN XÉT */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
        {items.map((r) => (
          <div key={r.id} className="p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{r.userName || 'Khán giả'}</p>
                <SaoHang score={r.score} />
              </div>
              {r.comment && <p className="text-sm text-gray-300 mt-2 leading-relaxed">{r.comment}</p>}
              <p className="text-xs text-gray-600 mt-2">{dayjs(r.createdAt).format('DD/MM/YYYY')}</p>
            </div>
            {laAdmin && (
              <button onClick={() => setRemoving(r)} title="Gỡ đánh giá"
                className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 flex-shrink-0">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
            Trước
          </button>
          <span className="text-sm text-gray-500">Trang {page}/{totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
            Sau
          </button>
        </div>
      )}

      {removing && (
        // Gỡ xong tải lại CẢ KHỐI: điểm trung bình và phân bố do backend tính, xoá dòng khỏi
        // state là hiển thị sai điểm.
        <RemoveModal rating={removing} onClose={() => setRemoving(null)} onDone={load} />
      )}
    </div>
  )
}

export default ShowRatings
