// src/pages/admin/AdminSettlementsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Đây là tiền của phòng trà đang bị hệ thống GIỮ LẠI vì nghi buổi diễn không chạy đủ như đã hứa
//   với người mua vé. Admin phải trả lời đúng một câu: buổi diễn có thật sự diễn ra đủ không.
// - Backend trả kèm ĐÚNG bằng chứng đã khiến khoản tiền bị giữ (giờ dự kiến, giờ thật, tỉ lệ,
//   ngưỡng đang áp) để Admin không phải tự đi tra rồi tính lại một con số có thể lệch. Vì vậy màn
//   này hiển thị nguyên các con số đó, KHÔNG tự tính lại tỉ lệ ở FE.
// - verdict='NeverStarted': buổi diễn đã đóng mà chưa từng được đánh dấu bắt đầu — nhiều khả năng
//   không diễn ra, và khi đó người mua vé cần được hoàn tiền.
//   verdict='Measured': có diễn nhưng ngắn hơn dự kiến, so ratio với threshold.
// - Quyết định ở đây KHÔNG tự tạo hoàn tiền cho người mua — hoàn tiền là luồng riêng ở trang
//   "Yêu cầu hoàn tiền". hasPendingRefund cảnh báo khoản này còn yêu cầu hoàn tiền chưa xử lý.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Check, Lock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getSettlementsPendingReview, reviewSettlement } from '../../services/moneyServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const fmtTime = (v) => (v ? dayjs(v).format('HH:mm DD/MM/YYYY') : '—')

const AdminSettlementsPage = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [notes, setNotes] = useState({})
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  const fetchQueue = useCallback(async (page) => {
    setIsLoading(true)
    try {
      const res = await getSettlementsPendingReview({ page, pageSize: 20 })
      if (res.success) {
        setItems(res.data.items)
        setPagination((p) => ({ ...p, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
      }
    } catch {
      toast.error('Không tải được danh sách quyết toán.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const run = async () => { await fetchQueue(pagination.page) }
    run()
  }, [fetchQueue, pagination.page])

  const handle = async (item, decision) => {
    const note = (notes[item.settlementId] || '').trim()
    if (!note) {
      toast.error('Phải ghi lý do quyết định.')
      return
    }
    setBusyId(item.settlementId)
    try {
      await reviewSettlement(item.settlementId, { decision, note })
      toast.success(decision === 'Release' ? 'Đã nhả tiền cho phòng trà.' : 'Đã giữ lại khoản này.')
      await fetchQueue(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xử lý thất bại.', { duration: 7000 })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Quyết toán chờ xử lý</h1>
        <p className="text-gray-400 text-sm">
          Tiền của phòng trà đang bị giữ vì nghi buổi diễn không chạy đủ như đã hứa với người mua vé.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-[#C3B665]" /></div>
      ) : items.length === 0 ? (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
          <Check size={32} className="mx-auto mb-3 text-green-500/50" />
          Không có khoản quyết toán nào đang bị giữ.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => {
            const isBusy = busyId === s.settlementId
            const neverStarted = s.verdict === 'NeverStarted'
            return (
              <div key={s.settlementId} className="bg-gray-950 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold">#{s.settlementId}</span>
                      <span className="text-[#C3B665] font-bold">{fmtMoney(s.netAmount)}</span>
                      <span className="text-xs text-gray-500">(gộp {fmtMoney(s.grossAmount)})</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${neverStarted
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
                        {neverStarted ? 'Chưa từng bắt đầu' : 'Diễn ngắn hơn dự kiến'}
                      </span>
                      {s.hasPendingRefund && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-bold">
                          <AlertTriangle size={11} /> còn yêu cầu hoàn tiền chưa xử lý
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-white mt-2">{s.showName || `Buổi diễn #${s.showId ?? '—'}`}</p>

                    {/* Bằng chứng do backend trả — không tự tính lại ở FE */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-gray-600">Dự kiến</p>
                        <p className="text-gray-300 mt-0.5">{fmtTime(s.scheduledStart)}</p>
                        <p className="text-gray-500">đến {fmtTime(s.scheduledEnd)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Thực tế</p>
                        <p className="text-gray-300 mt-0.5">{fmtTime(s.actualStart)}</p>
                        <p className="text-gray-500">đến {fmtTime(s.actualEnd)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tỉ lệ đạt</p>
                        <p className="text-white font-bold mt-0.5">
                          {s.ratio != null ? `${(Number(s.ratio) * 100).toFixed(0)}%` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ngưỡng yêu cầu</p>
                        <p className="text-white font-bold mt-0.5">{(Number(s.threshold) * 100).toFixed(0)}%</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-2">
                      Loại giải ngân: {s.releaseType} · lên lịch {fmtTime(s.scheduledAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-72">
                    <input
                      value={notes[s.settlementId] || ''}
                      onChange={(e) => setNotes((p) => ({ ...p, [s.settlementId]: e.target.value }))}
                      placeholder="Lý do quyết định (bắt buộc)"
                      className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-600"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handle(s, 'Release')} disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-500/10 border border-green-500/40 text-green-400 px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-500/20 disabled:opacity-50">
                        <Check size={14} /> Nhả tiền
                      </button>
                      <button onClick={() => handle(s, 'Withhold')} disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/40 text-red-400 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 disabled:opacity-50">
                        <Lock size={14} /> Giữ lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Trang {pagination.page} / {pagination.totalPages} · {pagination.totalCount} khoản</p>
          <div className="flex gap-2">
            <button onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}
              className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] disabled:opacity-30"><ChevronLeft size={18} /></button>
            <button onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSettlementsPage
