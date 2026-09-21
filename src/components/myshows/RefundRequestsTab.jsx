// src/components/myshows/RefundRequestsTab.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Hai việc người mua PHẢI tự làm, nếu không tiền mắc lại:
//   1. `payoutAccountRequired` = true: cổng thanh toán không hoàn được vào giao dịch gốc, nên phải
//      khai tài khoản ngân hàng để nhận chuyển khoản tay. Không khai thì không ai chuyển được tiền.
//   2. Vé bán tại quầy hoàn bằng TIỀN MẶT: sau khi nhận tiền ở quầy, người mua bấm xác nhận để
//      đóng yêu cầu. Không bấm thì yêu cầu treo mãi.
// - `consent` khi khai tài khoản là bắt buộc phải true — đó là sự đồng ý cho dùng thông tin ngân hàng
//   để hoàn tiền, không phải một ô tuỳ chọn cho đẹp.
// - `expectedResolutionBy` là hạn hệ thống phải trả lời. Quá hạn có tác vụ nền tự duyệt, nên yêu cầu
//   có thể tự chuyển trạng thái mà không ai bấm.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Receipt, Landmark, HandCoins, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getMyRefundRequests, provideRefundPayoutAccount, confirmCashRefundHandedBack,
} from '../../services/ticketServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

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
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">Tài khoản nhận tiền hoàn</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <p className="text-xs text-ink-mute leading-relaxed">
            Giao dịch gốc không hoàn lại được qua cổng thanh toán, nên chúng tôi cần chuyển khoản tay.
            Số tiền hoàn: <span className="text-ink font-medium">{fmtMoney(request.refundAmount ?? request.amount)}</span>
          </p>

          <div>
            <label className="text-xs text-ink-mute">Ngân hàng <span className="text-danger">*</span></label>
            <input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} className={inputCls} placeholder="VD: Vietcombank" />
          </div>
          <div>
            <label className="text-xs text-ink-mute">Số tài khoản <span className="text-danger">*</span></label>
            <input value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} className={inputCls} inputMode="numeric" />
          </div>
          <div>
            <label className="text-xs text-ink-mute">Tên chủ tài khoản <span className="text-danger">*</span></label>
            <input value={form.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} className={inputCls} />
          </div>

          <label className="flex items-start gap-2 text-xs text-ink-soft cursor-pointer leading-relaxed">
            <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)}
              className="accent-brand mt-0.5 flex-shrink-0" />
            Tôi đồng ý cho nền tảng dùng thông tin ngân hàng này để hoàn tiền cho tôi.
          </label>

          <button type="submit" disabled={isBusy}
            className="w-full py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
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
  const [busyId, setBusyId] = useState(null)
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

  const xacNhanNhanTienMat = async (r) => {
    setBusyId(r.id)
    try {
      await confirmCashRefundHandedBack(r.id)
      toast.success('Đã xác nhận nhận tiền. Yêu cầu hoàn tiền được đóng lại.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xác nhận được.')
    } finally { setBusyId(null) }
  }

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-brand-text" /></div>
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-line rounded-xl p-10 text-center">
        <Receipt size={26} className="mx-auto mb-3 text-ink-mute" />
        <p className="text-sm text-ink-mute">Bạn chưa có yêu cầu hoàn tiền nào.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((r) => {
        const canKhaiTaiKhoan = r.payoutAccountRequired && !r.payoutAccountProvided
        const canXacNhanTienMat = r.cashRefundPending ?? (r.refundMethod === 'Cash' && r.status !== 'Completed')
        const dangBan = busyId === r.id

        return (
          <div key={r.id} className="bg-card border border-line rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-ink font-bold">{r.showName ?? `Yêu cầu #${r.id}`}</p>
                <p className="text-xs text-ink-mute mt-1">
                  Gửi lúc {dayjs(r.createdAt ?? r.requestedAt).format('HH:mm DD/MM/YYYY')}
                </p>
                {r.reason && <p className="text-xs text-ink-mute mt-0.5">Lý do: {r.reason}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-brand-text tabular-nums">
                  {fmtMoney(r.refundAmount ?? r.amount)}
                </p>
                <p className="text-xs text-ink-mute">{r.status}</p>
              </div>
            </div>

            {r.expectedResolutionBy && (
              <p className="mt-3 text-xs text-ink-mute flex items-center gap-1.5">
                <Clock size={12} /> Hạn phản hồi {dayjs(r.expectedResolutionBy).format('HH:mm DD/MM/YYYY')}
              </p>
            )}

            {canKhaiTaiKhoan && (
              <div className="mt-3 bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                  Giao dịch gốc không hoàn lại được qua cổng thanh toán. Bạn cần khai tài khoản ngân hàng,
                  nếu không thì không ai chuyển được tiền cho bạn.
                </p>
                <button onClick={() => setKhaiTaiKhoan(r)}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-hover">
                  <Landmark size={13} /> Khai tài khoản nhận tiền
                </button>
              </div>
            )}

            {canXacNhanTienMat && (
              <div className="mt-3 bg-blue-500/5 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-sky-700 leading-relaxed">
                  Vé này được hoàn bằng tiền mặt tại quầy. Sau khi đã nhận tiền, hãy bấm xác nhận để đóng yêu cầu.
                </p>
                <button onClick={() => xacNhanNhanTienMat(r)} disabled={dangBan}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/40 text-sky-700 text-xs font-bold hover:bg-blue-500/10 disabled:opacity-50">
                  {dangBan ? <Loader2 size={13} className="animate-spin" /> : <HandCoins size={13} />}
                  Tôi đã nhận tiền mặt
                </button>
              </div>
            )}

            {r.status === 'Completed' && (
              <p className="mt-3 text-xs text-success flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Đã hoàn tiền xong
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
