// src/pages/owner/OwnerDonationsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — ĐÂY LÀ TIỀN CỦA NGHỆ SĨ, KHÔNG PHẢI DOANH THU CỦA PHÒNG TRÀ:
// - Tiền donate đi qua ba chặng: khán giả trả cho nền tảng → nền tảng chuyển cho phòng trà →
//   phòng trà chuyển tiếp cho nghệ sĩ. Chủ phòng trà phải xác nhận HAI lần, mỗi chặng một lần:
//     Chặng 1 "Đã nhận tiền"   → POST /donations/{id}/acknowledge
//     Chặng 2 "Đã trả nghệ sĩ" → POST /donations/{id}/confirm-paid (kèm mã giao dịch + chứng từ)
// - `payoutDueAt` là HẠN phải chuyển tiếp cho nghệ sĩ. Quá hạn là căn cứ để nghệ sĩ khiếu nại và để
//   hệ thống cảnh cáo phòng trà — nên màn này tô đỏ khi sắp/đã quá hạn thay vì để nó lẫn vào danh sách.
// - `payoutReceivedAt` = null nghĩa là NỀN TẢNG CHƯA chuyển tiền về cho phòng trà. Đừng bắt chủ
//   "đã trả nghệ sĩ" khi họ còn chưa nhận được tiền.
// - KHÔNG có luồng hoàn tiền cho donate đã xác nhận — đừng thêm nút hoàn tiền ở đây.
// - `amountToPayPerformer` là số phải trả nghệ sĩ, KHÁC `gross` (khán giả trả) và `net` (sau phí).
//   Ba con số này không được gộp.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, HeartHandshake, CheckCircle2, Clock, AlertTriangle, X, Send, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getDonationsPendingAck, getDonationsAwaitingPayout,
  acknowledgeDonation, confirmDonationPaid,
} from '../../services/donationServices'
import { uploadImage } from '../../services/userServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

const TABS = [
  { key: 'ack', label: 'Chờ tôi xác nhận đã nhận tiền' },
  { key: 'payout', label: 'Chờ tôi chuyển cho nghệ sĩ' },
]

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Xác nhận đã trả nghệ sĩ</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-white font-medium">{donation.performerName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{donation.showName}</p>
            <p className="text-lg text-[#C3B665] font-bold mt-2 tabular-nums">{fmtMoney(donation.amountToPayPerformer)}</p>
            <p className="text-xs text-gray-600">Số phải chuyển cho nghệ sĩ</p>
          </div>

          <div>
            <label className="text-xs text-gray-500">Mã giao dịch chuyển khoản <span className="text-red-400">*</span></label>
            <input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className={inputCls}
              placeholder="Mã do ngân hàng của bạn cấp" />
            <p className="text-xs text-gray-600 mt-1">
              Đây là bằng chứng để đối chiếu nếu nghệ sĩ nói chưa nhận được tiền.
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500">Ảnh chứng từ</label>
            <div className="mt-1 flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 cursor-pointer">
                {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {evidenceUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                <input type="file" accept="image/*" className="hidden" disabled={isUploading}
                  onChange={(e) => taiChungTu(e.target.files?.[0])} />
              </label>
              {evidenceUrl && <CheckCircle2 size={16} className="text-green-400" />}
            </div>
          </div>

          <button type="submit" disabled={isBusy || isUploading}
            className="w-full py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
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

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = tab === 'ack'
        ? await getDonationsPendingAck({ pageSize: 50 })
        : await getDonationsAwaitingPayout({ pageSize: 50 })
      if (res.success) setItems(res.data.items ?? [])
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Tiền donate</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Đây là tiền khán giả tặng NGHỆ SĨ, phòng trà chỉ giữ hộ và chuyển tiếp — không phải doanh thu của bạn.
          </p>
        </div>
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tab === t.key
              ? 'bg-gray-800 border-[#C3B665]/40 text-[#C3B665]'
              : 'bg-black border-gray-800 text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
      ) : items.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <HeartHandshake size={28} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm text-gray-500">
            {tab === 'ack' ? 'Không có donate nào đang chờ bạn xác nhận.' : 'Không có donate nào đang chờ chuyển cho nghệ sĩ.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((d) => {
            const quaHan = d.payoutDueAt && dayjs(d.payoutDueAt).isBefore(dayjs())
            const sapHan = !quaHan && d.payoutDueAt && dayjs(d.payoutDueAt).diff(dayjs(), 'hour') < 24
            const chuaNhanTien = !d.payoutReceivedAt
            const dangBan = busyId === d.id

            return (
              <li key={d.id} className={`bg-gray-900 border rounded-xl p-5 ${quaHan ? 'border-red-500/40' : 'border-gray-800'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold">{d.performerName}</span>
                      {d.isAnonymous
                        ? <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs">Khán giả ẩn danh</span>
                        : d.displayName && <span className="text-xs text-gray-500">từ {d.displayName}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{d.showName}</p>
                    {d.message && <p className="text-sm text-gray-400 mt-2 italic">“{d.message}”</p>}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-[#C3B665] tabular-nums">{fmtMoney(d.amountToPayPerformer)}</p>
                    <p className="text-xs text-gray-600">phải trả nghệ sĩ</p>
                    <p className="text-xs text-gray-600 mt-1 tabular-nums">
                      Khán giả trả {fmtMoney(d.gross)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                  {d.payoutReceivedAt ? (
                    <span className="text-green-400 inline-flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Nền tảng đã chuyển tiền cho bạn {dayjs(d.payoutReceivedAt).format('DD/MM/YYYY')}
                    </span>
                  ) : (
                    <span className="text-gray-500 inline-flex items-center gap-1.5">
                      <Clock size={13} /> Nền tảng chưa chuyển tiền về cho bạn
                    </span>
                  )}

                  {d.payoutDueAt && (
                    <span className={`inline-flex items-center gap-1.5 ${quaHan ? 'text-red-400' : sapHan ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {(quaHan || sapHan) && <AlertTriangle size={13} />}
                      {quaHan ? 'Đã quá hạn chuyển cho nghệ sĩ ' : 'Hạn chuyển cho nghệ sĩ '}
                      {dayjs(d.payoutDueAt).format('HH:mm DD/MM/YYYY')}
                    </span>
                  )}
                </div>

                {quaHan && (
                  <p className="mt-2 text-xs text-red-400/90 leading-relaxed">
                    Quá hạn này là căn cứ để nghệ sĩ khiếu nại và để hệ thống cảnh cáo phòng trà. Hãy chuyển tiền và xác nhận sớm.
                  </p>
                )}

                <div className="mt-4">
                  {tab === 'ack' ? (
                    <button onClick={() => xacNhanNhan(d)} disabled={dangBan}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold hover:bg-[#d4c87f] disabled:opacity-50">
                      {dangBan ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      Tôi đã nhận được tiền
                    </button>
                  ) : (
                    <button onClick={() => setTraNgheSi(d)} disabled={dangBan || chuaNhanTien}
                      title={chuaNhanTien ? 'Nền tảng chưa chuyển tiền về cho bạn' : undefined}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold hover:bg-[#d4c87f] disabled:opacity-40 disabled:cursor-not-allowed">
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
