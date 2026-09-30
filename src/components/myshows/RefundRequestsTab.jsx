// src/components/myshows/RefundRequestsTab.jsx
//
// Đọc ĐÚNG RefundRequestDto (GET /tickets/refund-requests/my): amountRequested/amountApproved, status
// Pending|Approved|Rejected, resolvedAt, payoutAccountRequired + payoutAccountNumber. Bản trước đọc
// refundAmount/amount/refundMethod/cashRefundPending/payoutAccountProvided/showName — không trường nào
// tồn tại (đối chiếu swagger 30/09), nên số tiền hiện 0đ và nút khai tài khoản không bao giờ tắt.
// Bản trước còn có nút "Tôi đã nhận tiền mặt" gọi /cash-handed-back — endpoint đó là của NHÂN VIÊN/CHỦ
// phòng trà xác nhận đã trả tiền (MLACP-345), khán giả gọi sẽ nhận 403; và vé tiền mặt tại quầy không có
// người mua gắn tài khoản nên không bao giờ xuất hiện trong danh sách này. Đã bỏ.

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Receipt, Landmark, AlertTriangle, CheckCircle2, Clock, X, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getMyRefundRequests, provideRefundPayoutAccount } from '../../services/ticketServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const soTien = (r) => r.amountApproved ?? r.amountRequested
const TRANG_THAI = { Pending: 'Đang chờ duyệt', Approved: 'Đã duyệt hoàn tiền', Rejected: 'Bị từ chối' }
const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line text-sm text-ink focus:outline-none focus:border-ink/50'

const PayoutAccountModal = ({ request, onClose, onSaved }) => {
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountHolder: '', consent: false })
  const [isBusy, setIsBusy] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountHolder.trim()) {
      toast.error('Cần điền đủ ngân hàng, số tài khoản và tên chủ tài khoản.')
      return
    }
    if (!form.consent) {
      toast.error('Cần đồng ý cho dùng thông tin ngân hàng để hoàn tiền.')
      return
    }
    setIsBusy(true)
    try {
      await provideRefundPayoutAccount(request.id, {
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        accountHolder: form.accountHolder.trim(),
        consent: true,
      })
      toast.success('Đã gửi thông tin tài khoản nhận tiền.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được thông tin tài khoản.')
    } finally { setIsBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/80" onClick={onClose} />
      <div className="relative bg-card border border-line w-full max-w-md shadow-soft">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-3xl text-ink">Tài khoản nhận tiền hoàn</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken text-ink-soft" aria-label="Đóng"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <p className="text-xs text-ink-mute leading-relaxed">
            Giao dịch gốc không hoàn lại được qua cổng thanh toán, nên chúng tôi cần chuyển khoản tay.
            Số tiền hoàn: <span className="text-ink font-medium">{fmtMoney(soTien(request))}</span>
          </p>

          <div>
            <label className="text-xs text-ink-mute">Ngân hàng <span className="text-danger">*</span></label>
            <input aria-label="Ngân hàng" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} className={inputCls} placeholder="VD: Vietcombank" />
          </div>
          <div>
            <label className="text-xs text-ink-mute">Số tài khoản <span className="text-danger">*</span></label>
            <input aria-label="Số tài khoản" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} className={inputCls} inputMode="numeric" />
          </div>
          <div>
            <label className="text-xs text-ink-mute">Tên chủ tài khoản <span className="text-danger">*</span></label>
            <input aria-label="Tên chủ tài khoản" value={form.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} className={inputCls} />
          </div>

          <label className="flex items-start gap-2 text-xs text-ink-soft cursor-pointer leading-relaxed">
            <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)}
              className="accent-ink mt-0.5 flex-shrink-0" />
            Tôi đồng ý cho nền tảng dùng thông tin ngân hàng này để hoàn tiền cho tôi.
          </label>

          <button type="submit" disabled={isBusy}
            className="w-full py-2.5 bg-ink text-lamp font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {isBusy && <Loader2 size={16} className="animate-spin" />} Gửi thông tin
          </button>
        </form>
      </div>
    </div>
  )
}

const RefundRequestsTab = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [khaiTaiKhoan, setKhaiTaiKhoan] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMyRefundRequests({ pageSize: 50 })
      if (res.success) {
        const ds = res.data
        setItems((Array.isArray(ds) ? ds : ds?.items) ?? [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được yêu cầu hoàn tiền.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-ink" /></div>
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-line p-10 text-center">
        <Receipt size={26} className="mx-auto mb-3 text-ink-mute" />
        <p className="text-sm text-ink-mute">Bạn chưa có yêu cầu hoàn tiền nào.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((r) => {
        // Chỉ cần khai khi hệ thống đòi VÀ chưa khai; đã bị từ chối thì khai cũng vô nghĩa.
        const canKhaiTaiKhoan = r.payoutAccountRequired && !r.payoutAccountNumber && r.status !== 'Rejected'

        return (
          <div key={r.id} className="bg-card border border-line p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-ink font-bold">Yêu cầu hoàn tiền #{r.id}</p>
                <p className="text-xs text-ink-mute mt-1">
                  Gửi lúc {dayjs(r.createdAt).format('HH:mm DD/MM/YYYY')}
                </p>
                {r.reason && <p className="text-xs text-ink-mute mt-0.5">Lý do: {r.reason}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-ink tabular-nums">{fmtMoney(soTien(r))}</p>
                {r.amountApproved != null && r.amountApproved !== r.amountRequested && (
                  <p className="text-xs text-ink-mute tabular-nums">Yêu cầu {fmtMoney(r.amountRequested)}</p>
                )}
                <p className="text-xs text-ink-mute">{TRANG_THAI[r.status] ?? r.status}</p>
              </div>
            </div>

            {r.status === 'Pending' && r.expectedResolutionBy && (
              <p className="mt-3 text-xs text-ink-mute flex items-center gap-1.5">
                <Clock size={12} /> Hạn phản hồi {dayjs(r.expectedResolutionBy).format('HH:mm DD/MM/YYYY')}
              </p>
            )}

            {canKhaiTaiKhoan && (
              <div className="mt-3 bg-warning/5 border border-warning/30 p-3">
                <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                  Giao dịch gốc không hoàn lại được qua cổng thanh toán. Bạn cần khai tài khoản ngân hàng,
                  nếu không thì không ai chuyển được tiền cho bạn.
                </p>
                <button onClick={() => setKhaiTaiKhoan(r)}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-ink text-lamp text-xs font-bold hover:bg-board">
                  <Landmark size={13} /> Khai tài khoản nhận tiền
                </button>
              </div>
            )}

            {r.status === 'Approved' && (
              <p className="mt-3 text-xs text-success flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Đã duyệt hoàn tiền
                {r.resolvedAt && ` lúc ${dayjs(r.resolvedAt).format('HH:mm DD/MM/YYYY')}`}
              </p>
            )}
            {r.status === 'Rejected' && (
              <p className="mt-3 text-xs text-danger flex items-center gap-1.5">
                <XCircle size={13} /> Yêu cầu bị từ chối
              </p>
            )}
          </div>
        )
      })}

      {khaiTaiKhoan && (
        <PayoutAccountModal request={khaiTaiKhoan} onClose={() => setKhaiTaiKhoan(null)} onSaved={load} />
      )}
    </div>
  )
}

export default RefundRequestsTab
