// src/pages/owner/OwnerDonationsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — ĐÂY LÀ TIỀN CỦA NGHỆ SĨ, KHÔNG PHẢI DOANH THU CỦA PHÒNG TRÀ:
// - Tiền donate đi qua ba chặng: khán giả trả cho nền tảng → nền tảng chuyển cho phòng trà →
//   phòng trà chuyển tiếp cho nghệ sĩ. Chủ phòng trà phải xác nhận HAI lần, mỗi chặng một lần:
//     Chặng 1 "Đã nhận tiền"   → POST /donations/{id}/acknowledge
//     Chặng 2 "Đã trả nghệ sĩ" → POST /donations/{id}/confirm-paid (kèm mã giao dịch + chứng từ)
// - `payoutDueAt` là HẠN phải chuyển tiếp cho nghệ sĩ. Quá hạn là căn cứ để nghệ sĩ khiếu nại và để
//   hệ thống cảnh cáo phòng trà — nên màn này tô đỏ khi sắp/đã quá hạn thay vì để nó lẫn vào danh sách.
// - `autoConfirmDeadline` là hạn mà hệ thống TỰ XÁC NHẬN thay chủ nếu chủ không bấm. Phải hiện, vì
//   chủ dễ tưởng "không bấm thì không có gì xảy ra" — trong khi tự xác nhận sẽ khởi động luôn đồng
//   hồ hạn chuyển tiếp cho nghệ sĩ. Khác hẳn `payoutDueAt` (hạn chuyển tiền cho nghệ sĩ).
// - `payoutReceivedAt` = null nghĩa là NỀN TẢNG CHƯA chuyển tiền về cho phòng trà. Đừng bắt chủ
//   "đã trả nghệ sĩ" khi họ còn chưa nhận được tiền.
// - KHÔNG có luồng hoàn tiền cho donate đã xác nhận — đừng thêm nút hoàn tiền ở đây.
// - `amountToPayPerformer` là số phải trả nghệ sĩ, KHÁC `gross` (khán giả trả) và `net` (sau phí).
//   Ba con số này không được gộp.
// - TAB "LỊCH SỬ" DÙNG ENDPOINT KHÁC và trả về HÌNH DẠNG KHÁC: /donations/owner-history trả một
//   BẢN TỔNG HỢP (OwnerDonationHistorySummaryDto) có các con số đếm + `items` phân trang bên trong,
//   không phải mảng trần như hai tab kia. Đừng dùng chung chỗ đọc dữ liệu.
// - GỠ LỜI NHẮN chỉ ẩn lời nhắn khỏi livestream; KHÔNG hoàn tiền, và lời nhắn gốc vẫn được lưu để
//   đối chiếu. Người đang xem nhận sự kiện SignalR DonationMessageHidden.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, HeartHandshake, CheckCircle2, Clock, AlertTriangle, X, Send, RefreshCw, EyeOff, History } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getDonationsPendingAck, getDonationsAwaitingPayout, getOwnerDonationHistory,
  acknowledgeDonation, confirmDonationPaid, hideDonationMessage,
} from '../../services/donationServices'
import { uploadImage } from '../../services/userServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

const TABS = [
  { key: 'ack', label: 'Chờ tôi xác nhận đã nhận tiền' },
  { key: 'payout', label: 'Chờ tôi chuyển cho nghệ sĩ' },
  { key: 'history', label: 'Lịch sử' },
]

// Trạng thái chuyển tiếp trong lịch sử — chuỗi của backend, chỉ ánh xạ giá trị đã biết.
const TRANG_THAI_CHUYEN = {
  Paid: { chu: 'Đã chuyển nghệ sĩ', mau: 'text-success bg-green-500/10' },
  Pending: { chu: 'Chưa chuyển', mau: 'text-warning bg-yellow-500/10' },
  Overdue: { chu: 'Quá hạn', mau: 'text-danger bg-red-500/10' },
}

const ConfirmPaidModal = ({ donation, onClose, onSaved }) => {
  const [paymentRef, setPaymentRef] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const taiChungTu = async (file) => {
    if (!file) return
    setIsUploading(true)
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      setEvidenceUrl(up.data?.url ?? up.data)
      toast.success('Đã tải chứng từ lên.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được chứng từ.')
    } finally {
      setIsUploading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!paymentRef.trim()) { toast.error('Cần nhập mã giao dịch chuyển khoản.'); return }
    setIsBusy(true)
    try {
      await confirmDonationPaid(donation.id, {
        paymentRef: paymentRef.trim(),
        paymentEvidenceUrl: evidenceUrl || null,
      })
      toast.success('Đã ghi nhận việc chuyển tiền cho nghệ sĩ.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không ghi nhận được.')
    } finally { setIsBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">Xác nhận đã trả nghệ sĩ</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-espresso/40 border border-line rounded-lg p-4">
            <p className="text-sm text-ink font-medium">{donation.performerName}</p>
            <p className="text-xs text-ink-mute mt-0.5">{donation.showName}</p>
            <p className="text-lg text-brand-text font-bold mt-2 tabular-nums">{fmtMoney(donation.amountToPayPerformer)}</p>
            <p className="text-xs text-ink-mute">Số phải chuyển cho nghệ sĩ</p>
          </div>

          <div>
            <label className="text-xs text-ink-mute">Mã giao dịch chuyển khoản <span className="text-danger">*</span></label>
            <input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className={inputCls}
              placeholder="Mã do ngân hàng của bạn cấp" />
            <p className="text-xs text-ink-mute mt-1">
              Đây là bằng chứng để đối chiếu nếu nghệ sĩ nói chưa nhận được tiền.
            </p>
          </div>

          <div>
            <label className="text-xs text-ink-mute">Ảnh chứng từ</label>
            <div className="mt-1 flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-line text-ink-soft text-sm hover:bg-sunken cursor-pointer">
                {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {evidenceUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                <input type="file" accept="image/*" className="hidden" disabled={isUploading}
                  onChange={(e) => taiChungTu(e.target.files?.[0])} />
              </label>
              {evidenceUrl && <CheckCircle2 size={16} className="text-success" />}
            </div>
          </div>

          <button type="submit" disabled={isBusy || isUploading}
            className="w-full py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {isBusy && <Loader2 size={16} className="animate-spin" />} Xác nhận đã chuyển
          </button>
        </form>
      </div>
    </div>
  )
}

const OwnerDonationsPage = () => {
  const [tab, setTab] = useState('ack')
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [traNgheSi, setTraNgheSi] = useState(null)
  // Chỉ có ở tab Lịch sử: các con số đếm nằm NGOÀI mảng items của bản tổng hợp.
  const [tongHop, setTongHop] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      if (tab === 'history') {
        const res = await getOwnerDonationHistory({ pageSize: 50 })
        if (res.success) {
          setTongHop(res.data ?? null)
          setItems(res.data?.items?.items ?? [])
        }
      } else {
        const res = tab === 'ack'
          ? await getDonationsPendingAck({ pageSize: 50 })
          : await getDonationsAwaitingPayout({ pageSize: 50 })
        if (res.success) setItems(res.data.items ?? [])
        setTongHop(null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách donate.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const xacNhanNhan = async (d) => {
    setBusyId(d.id)
    try {
      await acknowledgeDonation(d.id)
      toast.success('Đã xác nhận nhận được tiền.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xác nhận được.')
    } finally { setBusyId(null) }
  }

  // Gỡ lời nhắn khỏi livestream. Không hỏi lại bằng modal riêng vì việc này KHÔNG động tới tiền và
  // lời nhắn gốc vẫn được lưu — nhưng vẫn phải xác nhận một lần, vì người đang xem thấy thay đổi ngay.
  const goLoiNhan = async (d) => {
    if (!window.confirm(`Gỡ lời nhắn của khoản donate này khỏi livestream?

Không hoàn tiền, và lời nhắn gốc vẫn được lưu để đối chiếu.`)) return
    setBusyId(d.id)
    try {
      await hideDonationMessage(d.id)
      toast.success('Đã gỡ lời nhắn khỏi livestream.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gỡ được lời nhắn.')
    } finally { setBusyId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Tiền donate</h1>
          <p className="text-ink-soft text-sm leading-relaxed">
            Đây là tiền khán giả tặng NGHỆ SĨ, phòng trà chỉ giữ hộ và chuyển tiếp — không phải doanh thu của bạn.
          </p>
        </div>
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken disabled:opacity-50">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tab === t.key
              ? 'bg-sunken border-brand/40 text-brand-text'
              : 'bg-page border-line text-ink-soft hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-10 text-center">
          <HeartHandshake size={28} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">
            {tab === 'ack' ? 'Không có donate nào đang chờ bạn xác nhận.'
              : tab === 'payout' ? 'Không có donate nào đang chờ chuyển cho nghệ sĩ.'
              : 'Chưa có khoản donate nào trong kỳ này.'}
          </p>
        </div>
      ) : tab === 'history' ? (
        <>
          {/* CÁC CON SỐ ĐẾM nằm ngoài mảng items — đây là bản tổng hợp, không phải mảng trần */}
          {tongHop && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-card border border-line rounded-xl p-4">
                <p className="text-xs text-ink-mute">Tổng khán giả tặng</p>
                <p className="text-lg font-bold text-brand-text mt-1 tabular-nums">{fmtMoney(tongHop.totalGross)}</p>
                <p className="text-[11px] text-ink-mute mt-1">{tongHop.totalCount} khoản</p>
              </div>
              <div className="bg-card border border-line rounded-xl p-4">
                <p className="text-xs text-ink-mute">Đã chuyển nghệ sĩ</p>
                <p className="text-lg font-bold text-ink mt-1 tabular-nums">{tongHop.paidCount}</p>
              </div>
              <div className="bg-card border border-line rounded-xl p-4">
                <p className="text-xs text-ink-mute">Còn trong hạn</p>
                <p className="text-lg font-bold text-ink mt-1 tabular-nums">{tongHop.withinHoldCount}</p>
              </div>
              <div className={`bg-card border rounded-xl p-4 ${tongHop.overdueCount > 0 ? 'border-red-500/40' : 'border-line'}`}>
                <p className="text-xs text-ink-mute">Quá hạn</p>
                <p className={`text-lg font-bold mt-1 tabular-nums ${tongHop.overdueCount > 0 ? 'text-danger' : 'text-ink'}`}>
                  {tongHop.overdueCount}
                </p>
              </div>
            </div>
          )}

          {tongHop && (
            <p className="text-xs text-ink-mute flex items-center gap-1.5">
              <History size={12} />
              Kỳ {dayjs(tongHop.periodFrom).format('DD/MM/YYYY')} – {dayjs(tongHop.periodTo).format('DD/MM/YYYY')}
            </p>
          )}

          <ul className="space-y-2">
            {items.map((d) => {
              const tt = TRANG_THAI_CHUYEN[d.payoutStatus]
              return (
                <li key={d.id} className="bg-card border border-line rounded-xl p-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-ink text-sm font-semibold">{d.performerName}</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${tt?.mau ?? 'text-ink-soft bg-line-strong/10'}`}>
                        {tt?.chu ?? d.payoutStatus}
                      </span>
                    </div>
                    <p className="text-xs text-ink-mute mt-0.5">{d.showName}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-mute">
                      <span>Tạo {dayjs(d.createdAt).format('DD/MM/YYYY')}</span>
                      {d.paymentConfirmedAt && <span>Thanh toán {dayjs(d.paymentConfirmedAt).format('DD/MM/YYYY')}</span>}
                      {d.payoutDueAt && <span>Hạn chuyển {dayjs(d.payoutDueAt).format('DD/MM/YYYY')}</span>}
                      {d.ownerPaidAt && <span>Bạn đã chuyển {dayjs(d.ownerPaidAt).format('DD/MM/YYYY')}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-brand-text tabular-nums">{fmtMoney(d.gross)}</p>
                    <p className="text-[11px] text-ink-mute">khán giả trả</p>
                    <p className="text-[11px] text-ink-mute mt-1 tabular-nums">sau phí {fmtMoney(d.net)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <ul className="space-y-3">
          {items.map((d) => {
            const quaHan = d.payoutDueAt && dayjs(d.payoutDueAt).isBefore(dayjs())
            const sapHan = !quaHan && d.payoutDueAt && dayjs(d.payoutDueAt).diff(dayjs(), 'hour') < 24
            const chuaNhanTien = !d.payoutReceivedAt
            const dangBan = busyId === d.id

            return (
              <li key={d.id} className={`bg-card border rounded-xl p-5 ${quaHan ? 'border-red-500/40' : 'border-line'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-ink font-bold">{d.performerName}</span>
                      {d.isAnonymous
                        ? <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs">Khán giả ẩn danh</span>
                        : d.displayName && <span className="text-xs text-ink-mute">từ {d.displayName}</span>}
                    </div>
                    <p className="text-xs text-ink-mute mt-0.5">{d.showName}</p>
                    {d.message && <p className="text-sm text-ink-soft mt-2 italic">“{d.message}”</p>}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-brand-text tabular-nums">{fmtMoney(d.amountToPayPerformer)}</p>
                    <p className="text-xs text-ink-mute">phải trả nghệ sĩ</p>
                    <p className="text-xs text-ink-mute mt-1 tabular-nums">
                      Khán giả trả {fmtMoney(d.gross)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                  {d.payoutReceivedAt ? (
                    <span className="text-success inline-flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Nền tảng đã chuyển tiền cho bạn {dayjs(d.payoutReceivedAt).format('DD/MM/YYYY')}
                    </span>
                  ) : (
                    <span className="text-ink-mute inline-flex items-center gap-1.5">
                      <Clock size={13} /> Nền tảng chưa chuyển tiền về cho bạn
                    </span>
                  )}

                  {/* Hạn TỰ XÁC NHẬN — chỉ có ý nghĩa ở tab đang chờ chủ xác nhận. Không hiện thì
                      chủ tưởng không bấm là không có gì xảy ra. */}
                  {tab === 'ack' && d.autoConfirmDeadline && (
                    <span className={`inline-flex items-center gap-1.5 ${
                      dayjs(d.autoConfirmDeadline).diff(dayjs(), 'hour') < 24 ? 'text-warning' : 'text-ink-mute'
                    }`}>
                      <Clock size={13} />
                      Không bấm thì hệ thống tự xác nhận lúc {dayjs(d.autoConfirmDeadline).format('HH:mm DD/MM/YYYY')}
                    </span>
                  )}

                  {d.payoutDueAt && (
                    <span className={`inline-flex items-center gap-1.5 ${quaHan ? 'text-danger' : sapHan ? 'text-warning' : 'text-ink-mute'}`}>
                      {(quaHan || sapHan) && <AlertTriangle size={13} />}
                      {quaHan ? 'Đã quá hạn chuyển cho nghệ sĩ ' : 'Hạn chuyển cho nghệ sĩ '}
                      {dayjs(d.payoutDueAt).format('HH:mm DD/MM/YYYY')}
                    </span>
                  )}
                </div>

                {quaHan && (
                  <p className="mt-2 text-xs text-danger/90 leading-relaxed">
                    Quá hạn này là căn cứ để nghệ sĩ khiếu nại và để hệ thống cảnh cáo phòng trà. Hãy chuyển tiền và xác nhận sớm.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Gỡ lời nhắn: chỉ hiện khi khoản này CÓ lời nhắn — nút không làm gì thì không bày ra */}
                  {d.message && (
                    <button onClick={() => goLoiNhan(d)} disabled={dangBan}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken disabled:opacity-50 order-last"
                      title="Ẩn lời nhắn khỏi livestream; không hoàn tiền">
                      <EyeOff size={15} /> Gỡ lời nhắn
                    </button>
                  )}
                  {tab === 'ack' ? (
                    <button onClick={() => xacNhanNhan(d)} disabled={dangBan}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-50">
                      {dangBan ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      Tôi đã nhận được tiền
                    </button>
                  ) : (
                    <button onClick={() => setTraNgheSi(d)} disabled={dangBan || chuaNhanTien}
                      title={chuaNhanTien ? 'Nền tảng chưa chuyển tiền về cho bạn' : undefined}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send size={15} /> Xác nhận đã trả nghệ sĩ
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {traNgheSi && (
        <ConfirmPaidModal donation={traNgheSi} onClose={() => setTraNgheSi(null)} onSaved={load} />
      )}
    </div>
  )
}

export default OwnerDonationsPage
