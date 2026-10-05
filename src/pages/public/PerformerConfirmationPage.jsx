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
//
// LÀM LẠI 30/09/2026:
// - HAI MỤC ĐÍCH, HAI CÂU HỎI (`purpose`, LookupPerformerConfirmationQueryHandler.cs:38-74):
//     BankAccount     — "tài khoản này có phải của bạn?" (có ngân hàng/số che/chủ tài khoản, KHÔNG có số tiền)
//     DonationReceipt — "bạn đã nhận khoản này chưa?" (có số tiền/buổi diễn, KHÔNG có tài khoản)
//   Bản cũ dùng một câu cho cả hai ("tài khoản đúng là của tôi VÀ tôi đã nhận được tiền") — nghệ sĩ xác nhận tài khoản
//   bị hỏi về một khoản tiền không tồn tại.
// - Hai lựa chọn là nhóm radio thật (fieldset + legend) thay cho hai nút không có trạng thái cho trình đọc màn hình.
// - Nút gửi KHÔNG bị khoá khi chưa chọn (GOV.UK: nút khoá không nói vì sao); bấm thì báo lỗi ngay dưới từng mục thiếu
//   và đưa focus tới mục đầu tiên. Lỗi máy chủ in trong trang, không chỉ một toast tự biến mất.
// - `outcome` (Confirmed/Disputed) được dịch — bản cũ in thẳng chữ tiếng Anh.
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { lookupPerformerConfirmation, respondToPerformerConfirmation } from '../../services/performerConfirmationServices'
import Wordmark from '../../components/brand/Wordmark'
import OTruong from '../../components/shared/OTruong'
import { ngayDayDu, gioTrongNgay } from '../../utils/ngayVietNam'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`

// Câu mô tả hậu quả khớp đúng việc RespondToPerformerConfirmationCommandHandler làm (đọc 30/09/2026):
//   BankAccount: đúng → account.IsVerified = true; sai → IsVerified = false + báo SecurityAlert cho mọi Admin.
//   DonationReceipt: đúng → ghi PerformerConfirmedReceipt vào nhật ký; sai → ghi PerformerDisputedReceipt + mở
//   Complaint(DonationNotPaid) có hạn xử lý ComplaintSlaHours. Đổi handler thì đổi các câu này theo.
const CAU_HOI = {
  BankAccount: {
    hoi: 'Tài khoản này có phải của bạn không?',
    dung: ['Đúng, đây là tài khoản của tôi', 'Tài khoản sẽ được ghi là đã được chính bạn xác nhận.'],
    sai: ['Không, đây không phải tài khoản của tôi', 'Quản trị viên nền tảng sẽ nhận cảnh báo để kiểm tra.'],
  },
  DonationReceipt: {
    hoi: 'Bạn đã nhận được khoản tiền này chưa?',
    dung: ['Rồi, tôi đã nhận được', 'Khoản này sẽ được ghi là nghệ sĩ đã xác nhận nhận được, công khai trên sao kê.'],
    sai: ['Chưa, tôi chưa nhận được', 'Một khiếu nại sẽ được mở để nền tảng kiểm tra với phòng trà.'],
  },
}

const KET_QUA = { Confirmed: 'Bạn đã xác nhận là đúng.', Disputed: 'Bạn đã báo là không đúng hoặc chưa nhận.' }

const TRANG_THAI = {
  Used: ['Bạn đã trả lời liên kết này', 'Mỗi liên kết chỉ dùng được một lần. Nếu cần sửa câu trả lời, hãy liên hệ phòng trà để họ gửi lại.'],
  Expired: ['Liên kết đã hết hạn', 'Hãy liên hệ phòng trà để họ gửi lại một liên kết mới.'],
  Outdated: ['Thông tin đã thay đổi sau khi liên kết được gửi', 'Tài khoản nhận tiền đã bị sửa sau khi email được gửi, nên nội dung trong liên kết này không còn đúng. Hãy liên hệ phòng trà để họ gửi lại liên kết mới.'],
}

// Khung trang đặt ở cấp module, KHÔNG định nghĩa trong hàm render: một component được tạo lại mỗi
// lần vẽ sẽ bị React tháo ra dựng lại, làm mất trạng thái bên trong và giao diện nhảy.
const Khung = ({ children }) => (
  <div className="min-h-screen bg-stock text-ink">
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-2xl mb-10"><Wordmark /></p>
      {children}
    </main>
  </div>
)

const PerformerConfirmationPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [info, setInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loi, setLoi] = useState(null)

  const [decision, setDecision] = useState(null) // 'Confirm' | 'Dispute'
  const [note, setNote] = useState('')
  const [dongY, setDongY] = useState(false)
  const [loiO, setLoiO] = useState({})
  const [loiGui, setLoiGui] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [daTraLoi, setDaTraLoi] = useState(false)
  const refChon = useRef(null)
  const refDongY = useRef(null)

  const load = useCallback(async () => {
    if (!token) {
      setLoi('Liên kết thiếu mã xác nhận. Hãy mở lại đúng liên kết trong email.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await lookupPerformerConfirmation(token)
      if (!res.success) throw new Error('lien-ket')
      setInfo(res.data)
    } catch (err) {
      setLoi(err.response?.data?.message || 'Không đọc được liên kết này. Có thể liên kết đã hỏng hoặc hết hạn.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const guiTraLoi = async (e) => {
    e.preventDefault()
    const thieu = {}
    if (!decision) thieu.chon = 'Hãy chọn một câu trả lời.'
    if (!dongY) thieu.dongY = 'Cần đồng ý cho xử lý dữ liệu thì mới gửi được câu trả lời.'
    setLoiO(thieu)
    setLoiGui(null)
    if (thieu.chon) { refChon.current?.focus(); return }
    if (thieu.dongY) { refDongY.current?.focus(); return }
    setIsSending(true)
    try {
      await respondToPerformerConfirmation({ token, decision, consentToDataProcessing: true, note: note.trim() || null })
      setDaTraLoi(true)
    } catch (err) {
      setLoiGui(err.response?.data?.message || 'Chưa gửi được câu trả lời. Hãy thử lại.')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return <Khung><div className="h-64 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang đọc liên kết" /></Khung>
  }

  if (loi || !info) {
    return (
      <Khung>
        <h1 className="text-4xl">Không mở được liên kết</h1>
        <p className="mt-3 text-lg text-ink-soft">{loi}</p>
      </Khung>
    )
  }

  if (daTraLoi) {
    return (
      <Khung>
        <h1 className="text-4xl" tabIndex={-1} ref={(el) => el?.focus()}>Đã ghi nhận câu trả lời</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Cảm ơn {info.performerName}. Câu trả lời của bạn đã được lưu. Bạn có thể đóng trang này.
        </p>
      </Khung>
    )
  }

  // Ba trạng thái không trả lời được — mỗi cái cần một lời khuyên khác nhau.
  const tt = TRANG_THAI[info.state]
  if (tt) {
    return (
      <Khung>
        <h1 className="text-4xl">{tt[0]}</h1>
        <p className="mt-3 text-lg text-ink-soft">{tt[1]}</p>
        {info.outcome && <p className="mt-4 border-l-4 border-ink pl-3">{KET_QUA[info.outcome] ?? info.outcome}</p>}
      </Khung>
    )
  }

  const cau = CAU_HOI[info.purpose] ?? CAU_HOI.DonationReceipt
  const laTaiKhoan = info.purpose === 'BankAccount'

  return (
    <Khung>
      <h1 className="text-4xl">Xin chào {info.performerName}</h1>
      <p className="mt-3 text-lg text-ink-soft">
        {laTaiKhoan ? 'Phòng trà đã khai một tài khoản nhận tiền cho bạn và cần bạn xác nhận.' : 'Phòng trà báo đã chuyển cho bạn một khoản tiền ủng hộ và cần bạn xác nhận.'}
        {' '}Liên kết này dùng một lần, hết hạn lúc <span className="font-mono text-base text-ink">{gioTrongNgay(info.expiresAt)} ngày {ngayDayDu(info.expiresAt)}</span>.
      </p>

      <dl className="mt-8 border-y-2 border-ink divide-y divide-ink/20">
        {laTaiKhoan ? (
          <>
            {info.bankName && <div className="py-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-3"><dt className="text-ink-mute">Ngân hàng</dt><dd>{info.bankName}</dd></div>}
            {info.accountNumberMasked && <div className="py-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-3"><dt className="text-ink-mute">Số tài khoản</dt><dd className="font-mono">{info.accountNumberMasked}</dd></div>}
            {info.accountHolder && <div className="py-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-3"><dt className="text-ink-mute">Chủ tài khoản</dt><dd>{info.accountHolder}</dd></div>}
          </>
        ) : (
          <>
            {(info.showName || info.venueName) && <div className="py-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-3"><dt className="text-ink-mute">Buổi diễn</dt><dd>{[info.showName, info.venueName].filter(Boolean).join(' · ')}</dd></div>}
            {info.amount != null && <div className="py-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-3"><dt className="text-ink-mute">Số tiền phòng trà báo đã chuyển</dt><dd className="font-mono text-2xl">{fmtTien(info.amount)}</dd></div>}
            {info.paymentRef && <div className="py-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-3"><dt className="text-ink-mute">Mã tham chiếu</dt><dd className="font-mono break-all">{info.paymentRef}</dd></div>}
            {/* MLACP-673: ảnh chứng từ phòng trà đã nộp — nghệ sĩ đối chiếu với sao kê của mình trước khi xác nhận. */}
            {info.paymentEvidenceUrl && (
              <div className="py-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-3">
                <dt className="text-ink-mute">Chứng từ chuyển khoản</dt>
                <dd>
                  <a href={info.paymentEvidenceUrl} target="_blank" rel="noopener noreferrer" className="block w-fit">
                    <img src={info.paymentEvidenceUrl} alt="Ảnh chứng từ chuyển khoản phòng trà đã nộp"
                      className="max-h-80 max-w-full border border-line" loading="lazy" />
                  </a>
                  <span className="block mt-1 text-sm text-ink-mute">Bấm vào ảnh để xem cỡ lớn.</span>
                </dd>
              </div>
            )}
          </>
        )}
      </dl>

      <form onSubmit={guiTraLoi} noValidate className="mt-8 space-y-6">
        <fieldset aria-describedby={loiO.chon ? 'loi-chon' : undefined}>
          <legend className="text-2xl font-display mb-3">{cau.hoi}</legend>
          {loiO.chon && <p id="loi-chon" className="mb-2 font-semibold text-danger">{loiO.chon}</p>}
          <div className="space-y-3">
            {[['Confirm', cau.dung], ['Dispute', cau.sai]].map(([gt, [nhan, moTa]], i) => (
              <label key={gt} className={`flex items-start gap-3 p-4 border-2 cursor-pointer ${decision === gt ? 'border-ink bg-card' : 'border-ink/30 hover:border-ink'}`}>
                <input type="radio" name="tra-loi" value={gt} checked={decision === gt} ref={i === 0 ? refChon : undefined}
                  onChange={() => { setDecision(gt); setLoiO((o) => ({ ...o, chon: undefined })) }}
                  className="mt-1 w-5 h-5 accent-ink flex-shrink-0" />
                <span>
                  <span className="block font-semibold">{nhan}</span>
                  <span className="block text-ink-soft mt-0.5">{moTa}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <OTruong nhan="Ghi chú thêm" khongBatBuoc goiY="Tối đa 500 ký tự.">
          {(p) => <textarea {...p} className={`${p.className} py-2`} value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} />}
        </OTruong>

        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" ref={refDongY} checked={dongY} aria-invalid={loiO.dongY ? 'true' : undefined}
              aria-describedby={loiO.dongY ? 'loi-dong-y' : undefined}
              onChange={(e) => { setDongY(e.target.checked); setLoiO((o) => ({ ...o, dongY: undefined })) }}
              className="mt-1 w-5 h-5 accent-ink flex-shrink-0" />
            <span>Tôi đồng ý cho MusicLounge xử lý email và thông tin tài khoản nhận tiền của tôi cho mục đích xác nhận này.</span>
          </label>
          {loiO.dongY && <p id="loi-dong-y" className="mt-1.5 font-semibold text-danger">{loiO.dongY}</p>}
        </div>

        {loiGui && <p role="alert" className="border-2 border-danger p-4 font-semibold text-danger">{loiGui}</p>}

        <button type="submit" disabled={isSending}
          className="w-full min-h-[48px] bg-ink text-lamp font-semibold inline-flex items-center justify-center gap-2 hover:bg-board disabled:opacity-60">
          {isSending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Gửi câu trả lời
        </button>
      </form>
    </Khung>
  )
}

export default PerformerConfirmationPage
