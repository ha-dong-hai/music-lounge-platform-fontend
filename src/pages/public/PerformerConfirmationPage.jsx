// src/pages/public/PerformerConfirmationPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Trang này dành cho NGHỆ SĨ, người KHÔNG có tài khoản trên hệ thống. Họ mở nó từ liên kết trong
//   email, nên trang phải chạy được khi chưa đăng nhập và không được đòi đăng nhập.
// - Token lấy từ query string (`?token=...`) rồi gửi trong BODY, không đưa vào đường dẫn API — đường
//   dẫn request bị ghi vào log, và token trong log là liên kết ai đọc log cũng dùng được.
// - Liên kết DÙNG MỘT LẦN và có thời hạn. Bốn trạng thái phải hiển thị khác nhau, vì người nhận cần
//   biết nên làm gì tiếp:
//     Open     — trả lời được
//     Used     — đã trả lời rồi, hiện kết quả đã chọn
//     Expired  — hết hạn, cần phòng trà gửi lại liên kết
//     Outdated — tài khoản nhận tiền đã bị sửa SAU khi gửi liên kết, nên nội dung không còn đúng;
//                KHÔNG cho xác nhận, vì xác nhận một thông tin đã thay đổi là vô nghĩa
// - Ô đồng ý xử lý dữ liệu là BẮT BUỘC theo luật, không phải tuỳ chọn cho đẹp.
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, Landmark, Music2,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { lookupPerformerConfirmation, respondToPerformerConfirmation } from '../../services/performerConfirmationServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const STATE_VIEW = {
  Used: {
    tieuDe: 'Bạn đã trả lời liên kết này',
    mo: 'Mỗi liên kết chỉ dùng được một lần. Nếu cần sửa câu trả lời, hãy liên hệ phòng trà để họ gửi lại.',
    cls: 'border-gray-700', icon: CheckCircle2, mauIcon: 'text-gray-400',
  },
  Expired: {
    tieuDe: 'Liên kết đã hết hạn',
    mo: 'Hãy liên hệ phòng trà để họ gửi lại một liên kết mới.',
    cls: 'border-yellow-500/30', icon: Clock, mauIcon: 'text-yellow-400',
  },
  Outdated: {
    tieuDe: 'Thông tin đã thay đổi sau khi liên kết được gửi',
    mo: 'Tài khoản nhận tiền đã bị sửa sau khi email được gửi, nên nội dung trong liên kết này không còn đúng. Hãy liên hệ phòng trà để họ gửi lại liên kết mới.',
    cls: 'border-red-500/30', icon: AlertTriangle, mauIcon: 'text-red-400',
  },
}

const PerformerConfirmationPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [info, setInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loi, setLoi] = useState(null)

  const [decision, setDecision] = useState(null) // 'Confirm' | 'Dispute'
  const [note, setNote] = useState('')
  const [dongY, setDongY] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [daTraLoi, setDaTraLoi] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      setLoi('Liên kết không hợp lệ — thiếu mã xác nhận.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await lookupPerformerConfirmation(token)
      if (res.success) setInfo(res.data)
    } catch (err) {
      setLoi(err.response?.data?.message || 'Không đọc được liên kết này. Có thể liên kết đã hỏng hoặc hết hạn.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const guiTraLoi = async () => {
    if (!decision) { toast.error('Hãy chọn một trong hai câu trả lời.'); return }
    if (!dongY) { toast.error('Cần đồng ý cho xử lý dữ liệu để gửi câu trả lời.'); return }
    setIsSending(true)
    try {
      await respondToPerformerConfirmation({
        token, decision, consentToDataProcessing: true, note: note.trim() || null,
      })
      setDaTraLoi(true)
      toast.success('Đã ghi nhận câu trả lời của bạn.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được câu trả lời.')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  const Khung = ({ children }) => (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Music2 size={22} className="text-[#C3B665]" />
          <span className="text-lg font-bold tracking-wide text-[#C3B665]">Music Lounge</span>
        </div>
        {children}
      </div>
    </div>
  )

  if (loi || !info) {
    return (
      <Khung>
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6">
          <AlertTriangle size={22} className="text-red-400 mb-3" />
          <h1 className="text-xl font-bold mb-2">Không mở được liên kết</h1>
          <p className="text-sm text-gray-400 leading-relaxed">{loi}</p>
        </div>
      </Khung>
    )
  }

  if (daTraLoi) {
    return (
      <Khung>
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-6">
          <CheckCircle2 size={22} className="text-green-400 mb-3" />
          <h1 className="text-xl font-bold mb-2">Đã ghi nhận</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Cảm ơn {info.performerName}. Câu trả lời của bạn đã được gửi tới phòng trà và nền tảng.
            Bạn có thể đóng trang này.
          </p>
        </div>
      </Khung>
    )
  }

  // Ba trạng thái không trả lời được — mỗi cái cần một lời khuyên khác nhau.
  const v = STATE_VIEW[info.state]
  if (v) {
    return (
      <Khung>
        <div className={`bg-gray-900 border rounded-2xl p-6 ${v.cls}`}>
          <v.icon size={22} className={`${v.mauIcon} mb-3`} />
          <h1 className="text-xl font-bold mb-2">{v.tieuDe}</h1>
          <p className="text-sm text-gray-400 leading-relaxed">{v.mo}</p>
          {info.outcome && (
            <p className="text-sm text-gray-300 mt-3">
              Câu trả lời đã ghi nhận: <span className="font-medium">{info.outcome}</span>
            </p>
          )}
        </div>
      </Khung>
    )
  }

  return (
    <Khung>
      <h1 className="text-2xl font-bold mb-1">Xin chào {info.performerName}</h1>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        Phòng trà cần bạn xác nhận thông tin bên dưới. Liên kết này dùng một lần và
        hết hạn lúc {dayjs(info.expiresAt).format('HH:mm DD/MM/YYYY')}.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        {(info.showName || info.venueName) && (
          <div>
            <p className="text-xs text-gray-500">Buổi diễn</p>
            <p className="text-sm text-white mt-0.5">
              {[info.showName, info.venueName].filter(Boolean).join(' · ')}
            </p>
          </div>
        )}

        {info.amount != null && (
          <div>
            <p className="text-xs text-gray-500">Số tiền phòng trà báo đã chuyển cho bạn</p>
            <p className="text-2xl font-bold text-[#C3B665] mt-0.5 tabular-nums">{fmtMoney(info.amount)}</p>
            {info.paymentRef && (
              <p className="text-xs text-gray-500 mt-1">Mã giao dịch: <span className="text-gray-300">{info.paymentRef}</span></p>
            )}
          </div>
        )}

        {(info.bankName || info.accountNumberMasked) && (
          <div>
            <p className="text-xs text-gray-500">Tài khoản nhận tiền đã khai cho bạn</p>
            <div className="mt-1 flex items-start gap-2">
              <Landmark size={15} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white">{info.bankName}</p>
                <p className="text-sm text-gray-400 tabular-nums">{info.accountNumberMasked}</p>
                {info.accountHolder && <p className="text-xs text-gray-500">{info.accountHolder}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-white">Thông tin trên có đúng không?</p>

        <button onClick={() => setDecision('Confirm')}
          className={`w-full text-left p-4 rounded-xl border transition-colors ${decision === 'Confirm'
            ? 'bg-green-500/10 border-green-500/40' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <CheckCircle2 size={16} className="text-green-400" /> Đúng, tôi đã nhận
          </span>
          <span className="block text-xs text-gray-500 mt-1">
            Thông tin tài khoản đúng là của tôi và tôi đã nhận được tiền.
          </span>
        </button>

        <button onClick={() => setDecision('Dispute')}
          className={`w-full text-left p-4 rounded-xl border transition-colors ${decision === 'Dispute'
            ? 'bg-red-500/10 border-red-500/40' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <XCircle size={16} className="text-red-400" /> Không đúng, hoặc tôi chưa nhận
          </span>
          <span className="block text-xs text-gray-500 mt-1">
            Tài khoản không phải của tôi, hoặc tôi chưa nhận được khoản tiền này.
          </span>
        </button>

        <div>
          <label className="text-xs text-gray-500">Ghi chú thêm (không bắt buộc)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
            className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 resize-none"
            placeholder="Nếu có gì cần nói rõ thêm, hãy ghi ở đây." />
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer leading-relaxed">
          <input type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)}
            className="accent-[#C3B665] mt-0.5 flex-shrink-0" />
          Tôi đồng ý cho Music Lounge xử lý email và thông tin tài khoản nhận tiền của tôi cho mục đích
          xác nhận khoản chi này.
        </label>

        <button onClick={guiTraLoi} disabled={isSending || !decision || !dongY}
          className="w-full py-3 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          {isSending && <Loader2 size={16} className="animate-spin" />} Gửi câu trả lời
        </button>
      </div>
    </Khung>
  )
}

export default PerformerConfirmationPage
