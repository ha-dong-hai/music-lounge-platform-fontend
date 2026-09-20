// src/pages/admin/AdminRefundsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Bấm "Duyệt hoàn" gọi VNPay hoàn tiền THẬT, không phải chỉ đổi trạng thái trong DB. Backend chỉ
//   ghi sổ khi VNPay xác nhận thành công. Trên tài khoản sandbox VNPay khoá sẵn chức năng hoàn tiền,
//   nên nút này rất có thể trả 503 — đó là giới hạn tài khoản, không phải lỗi code. Thông báo lỗi
//   hiển thị nguyên văn để phân biệt được hai trường hợp.
// - expectedResolutionBy là hạn phải trả lời người mua (tạo + refund_sla_hours, mặc định 72h).
//   Quá hạn tô đỏ. Có job nền auto-approve-overdue-refunds tự duyệt khi quá hạn, nên hàng đợi này
//   có thể tự vơi đi mà không ai bấm.
// - payoutAccountRequired = true nghĩa là VNPay không hoàn được giao dịch gốc, phải chuyển khoản tay
//   vào tài khoản người mua đã khai — khi đó nhập mã chuyển khoản vào ô ghi chú trước khi duyệt.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Check, X, Clock, AlertTriangle, ChevronLeft, ChevronRight, Banknote } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getPendingRefundRequests, processRefundRequest } from '../../services/moneyServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const AdminRefundsPage = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [notes, setNotes] = useState({})
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  const fetchQueue = useCallback(async (page) => {
    setIsLoading(true)
    try {
      const res = await getPendingRefundRequests({ page, pageSize: 20 })
      if (res.success) {
        setItems(res.data.items)
        setPagination((p) => ({ ...p, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
      }
    } catch {
      toast.error('Không tải được hàng đợi hoàn tiền.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const run = async () => { await fetchQueue(pagination.page) }
    run()
  }, [fetchQueue, pagination.page])

  const handle = async (item, decision) => {
    setBusyId(item.id)
    try {
      const note = (notes[item.id] || '').trim()
      await processRefundRequest(item.id, {
        decision,
        resolutionNote: note || null,
        // Trường hợp phải chuyển khoản tay thì chính ghi chú là mã tham chiếu chuyển khoản.
        manualTransferReference: item.payoutAccountRequired && note ? note : null,
      })
      toast.success(decision === 'Approved' ? 'Đã duyệt hoàn tiền.' : 'Đã từ chối yêu cầu.')
      await fetchQueue(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xử lý thất bại.', { duration: 8000 })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Yêu cầu hoàn tiền</h1>
        <p className="text-gray-400 text-sm">
          Duyệt sẽ gọi VNPay hoàn tiền thật cho người mua. Hệ thống chỉ ghi sổ khi VNPay xác nhận thành công.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-[#C3B665]" /></div>
      ) : items.length === 0 ? (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
          <Check size={32} className="mx-auto mb-3 text-green-500/50" />
          Không có yêu cầu hoàn tiền nào đang chờ.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const overdue = r.expectedResolutionBy && dayjs(r.expectedResolutionBy).isBefore(dayjs())
            const isBusy = busyId === r.id
            return (
              <div key={r.id} className="bg-gray-950 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold">#{r.id}</span>
                      <span className="text-[#C3B665] font-bold">{fmtMoney(r.amountRequested)}</span>
                      {r.refundPercentage != null && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs">
                          hoàn {Number(r.refundPercentage)}%
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                        <Clock size={12} />
                        {r.expectedResolutionBy ? dayjs(r.expectedResolutionBy).format('HH:mm DD/MM') : '-'}
                        {overdue && ' (quá hạn)'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1.5 whitespace-normal">{r.reason}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Tạo {dayjs(r.createdAt).format('HH:mm DD/MM/YYYY')} · Payment #{r.paymentId}
                    </p>

                    {r.payoutAccountRequired && (
                      <div className="mt-3 flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                        <Banknote size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="text-yellow-400 font-medium">Phải chuyển khoản tay — VNPay không hoàn được giao dịch gốc</p>
                          <p className="text-gray-400 mt-1">
                            {r.payoutBankName} · {r.payoutAccountNumber} · {r.payoutAccountHolder}
                          </p>
                          <p className="text-gray-500 mt-1">Chuyển xong, nhập mã giao dịch vào ô ghi chú rồi bấm Duyệt hoàn.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-72">
                    <input
                      value={notes[r.id] || ''}
                      onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                      placeholder={r.payoutAccountRequired ? 'Mã giao dịch chuyển khoản' : 'Ghi chú xử lý (không bắt buộc)'}
                      className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-600"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handle(r, 'Approved')} disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-500/10 border border-green-500/40 text-green-400 px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-500/20 disabled:opacity-50">
                        <Check size={14} /> {isBusy ? 'Đang xử lý...' : 'Duyệt hoàn'}
                      </button>
                      <button onClick={() => handle(r, 'Rejected')} disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/40 text-red-400 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 disabled:opacity-50">
                        <X size={14} /> Từ chối
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
          <p className="text-sm text-gray-500">Trang {pagination.page} / {pagination.totalPages} · {pagination.totalCount} yêu cầu</p>
          <div className="flex gap-2">
            <button onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}
              className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] disabled:opacity-30"><ChevronLeft size={18} /></button>
            <button onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 text-xs text-gray-600">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          Có job nền tự duyệt các yêu cầu quá hạn, nên hàng đợi này có thể tự vơi mà không ai bấm.
        </p>
      </div>
    </div>
  )
}

export default AdminRefundsPage
