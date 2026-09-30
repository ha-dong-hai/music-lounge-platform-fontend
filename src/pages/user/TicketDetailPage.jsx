// src/pages/user/TicketDetailPage.jsx
//
// CHI TIẾT MỘT TẤM VÉ — thứ người ta mở ra ở cửa phòng trà. Làm lại 30/09/2026 trong thế giới "tờ chương trình".
//
// LỖI THẬT CỦA BẢN CŨ, ĐÃ SỬA:
//  - MÃ QR IN NGƯỢC MÀU (ô trắng trên nền đen). Nhiều máy quét không đọc được mã đảo màu; chuẩn QR là ô đậm trên nền
//    sáng, có lề trống 4 ô quanh mã (DENSO WAVE, chủ sở hữu chuẩn). Nay: mực trên nền trắng, lề 24px.
//  - Mã QR hiện cho MỌI trạng thái, kể cả vé đã huỷ, đã hoàn tiền, chưa thanh toán — và cả vé xem trực tuyến (không có
//    cửa nào để quét). Nay chỉ vé tại chỗ ĐÃ THANH TOÁN mới có mã; các trạng thái khác nói rõ vì sao không có.
//  - Nhãn trạng thái luôn là dấu tích xanh, kể cả khi vé đã huỷ; chữ "Paid", "Order code" tiếng Anh.
//  - Bấm "Huỷ vé này" là huỷ NGAY, không hỏi lại — thao tác đụng tới tiền (WCAG 2.2 SC 3.3.4). Nay có hộp xác nhận,
//    nói trước hệ quả, và tải lại vé sau khi huỷ.
//  - Dòng chữ dưới mã in `id` của vé trong khi mã QR mang `qrCode` — nhân viên gõ tay dòng đó là tra không ra. Nay in
//    đúng chuỗi nằm trong mã.
//  - Ô email chuyển vé không có nhãn.
//  - Không hiện `fullRefundUntil` (MLACP-372): phòng trà đổi lịch/địa chỉ thì khách được huỷ hoàn 100% tới một mốc —
//    backend có trả nhưng trang không in, nên khách không biết mình có quyền đó.
//
// GIỚI HẠN ĐÃ BIẾT (thuộc backend): TicketDetailDto KHÔNG trả thông tin lượt chuyển vé đang chờ. Trang đọc
// `transferPending` / `transferRecipientEmail` nếu có, còn không thì chỉ biết lượt chuyển vừa gửi TRONG PHIÊN NÀY —
// tải lại trang là mất dấu, gửi lần nữa thì backend từ chối và câu từ chối được in nguyên văn.
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import QRCode from 'react-qr-code'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import DauMoc from '../../components/program/DauMoc'
import HopXacNhan from '../../components/shared/HopXacNhan'
import { getTicketDetail, cancelTicket, initiateTicketTransfer, cancelTicketTransfer } from '../../services/ticketServices'
import { thuVietHoa, ngayDayDu, ngayGon, gioTrongNgay } from '../../utils/ngayVietNam'
import { TRANG_THAI_VE, laVeTrucTuyen } from '../../utils/trangThaiVe'

const tien = (n) => `${Number(n ?? 0).toLocaleString('vi-VN')}đ`
const NUT_VIEN = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-60'
const NUT_DAC = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors disabled:opacity-60'

const Muc = ({ nhan, children }) => (
  <div className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 py-3 border-t border-ink/20 first:border-t-0">
    <dt className="text-ink-soft">{nhan}</dt>
    <dd className="font-semibold text-right break-words min-w-0">{children}</dd>
  </div>
)

const TicketDetailPage = () => {
  const { ticketId } = useParams()

  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [lanTai, setLanTai] = useState(0)
  const [moHuy, setMoHuy] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Chuyển nhượng vé: người nhận phải đã có tài khoản và phải TỰ ĐỒNG Ý nhận.
  // Trước khi họ đồng ý, người gửi vẫn huỷ được lượt chuyển.
  const [recipientEmail, setRecipientEmail] = useState('')
  const [busyTransfer, setBusyTransfer] = useState(null)
  const [loiChuyen, setLoiChuyen] = useState(null)
  const [vuaChuyenCho, setVuaChuyenCho] = useState(null) // email của lượt chuyển gửi trong phiên này

  const taiVe = useCallback(async () => {
    const res = await getTicketDetail(ticketId)
    if (!res?.success) throw new Error('ticket')
    setTicket(res.data)
  }, [ticketId])

  useEffect(() => {
    let huy = false
    const chay = async () => {
      setIsLoading(true)
      setApiError(null)
      try {
        await taiVe()
      } catch (err) {
        if (!huy) setApiError(err.response?.status === 404 || err.message === 'ticket' ? 'Không tìm thấy vé này.' : 'Vé chưa tải được.')
      } finally {
        if (!huy) setIsLoading(false)
      }
    }
    chay()
    return () => { huy = true }
  }, [taiVe, lanTai])

  const handleTransfer = async (e) => {
    e.preventDefault()
    const email = recipientEmail.trim()
    if (!email) { setLoiChuyen('Nhập email của người nhận vé.'); return }
    setLoiChuyen(null)
    setBusyTransfer('send')
    try {
      await initiateTicketTransfer(ticketId, email)
      toast.success('Đã gửi lượt chuyển vé. Vé chỉ sang tay khi người nhận đồng ý.')
      setVuaChuyenCho(email)
      setRecipientEmail('')
      await taiVe().catch(() => {})
    } catch (err) {
      setLoiChuyen(err.response?.data?.message || 'Không gửi được lượt chuyển vé.')
    } finally {
      setBusyTransfer(null)
    }
  }

  const handleCancelTransfer = async () => {
    setBusyTransfer('cancel')
    try {
      await cancelTicketTransfer(ticketId)
      toast.success('Đã huỷ lượt chuyển vé.')
      setVuaChuyenCho(null)
      await taiVe().catch(() => {})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không huỷ được lượt chuyển.')
    } finally {
      setBusyTransfer(null)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const res = await cancelTicket(ticketId)
      // data = id yêu cầu hoàn tiền, hoặc 0 với vé Pending (không sinh yêu cầu nào).
      toast.success(res?.data ? 'Đã gửi yêu cầu huỷ vé và hoàn tiền.' : 'Đã huỷ vé.')
      setMoHuy(false)
      await taiVe().catch(() => {})
    } catch (err) {
      // Giữ hộp mở thì câu lỗi bị che; đóng hộp rồi báo bằng toast đủ lâu để đọc (câu của backend thường dài).
      setMoHuy(false)
      toast.error(err.response?.data?.message || 'Không huỷ được vé.', { duration: 8000 })
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-stock pb-20" aria-busy="true" aria-label="Đang tải vé">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-10 space-y-5">
          <div className="h-5 w-32 bg-ink/10 animate-pulse" />
          <div className="h-56 border-2 border-ink/20 bg-ink/5 animate-pulse" />
          <div className="h-72 border-2 border-ink/20 bg-ink/5 animate-pulse" />
        </div>
      </div>
    )
  }

  if (apiError || !ticket) {
    return (
      <div className="min-h-[70vh] bg-stock flex flex-col items-center justify-center text-ink px-4 text-center">
        <h1 className="text-4xl mb-4">{apiError || 'Không tìm thấy vé này.'}</h1>
        {apiError === 'Vé chưa tải được.' && (
          <button type="button" onClick={() => setLanTai((n) => n + 1)} className={`${NUT_DAC} mb-3`}>Thử lại</button>
        )}
        <Link to="/my-shows" className="inline-flex items-center gap-2 min-h-[44px] font-semibold underline underline-offset-4"><ArrowLeft size={18} aria-hidden="true" /> Về Vé của tôi</Link>
      </div>
    )
  }

  const tt = TRANG_THAI_VE[ticket.status] ?? { nhan: ticket.status }
  const trucTuyen = laVeTrucTuyen(ticket.accessType)
  const batDau = ticket.showScheduledStart
  const maQr = ticket.qrCode || ticket.id
  const daVao = ticket.physicalDetail?.checkedInAt
  const coMaVaoCua = ticket.status === 'Confirmed' && !trucTuyen
  const hoanDu = ticket.fullRefundUntil && dayjs(ticket.fullRefundUntil).isAfter(dayjs()) ? ticket.fullRefundUntil : null
  const dangChoChuyen = ticket.transferPending || vuaChuyenCho
  const emailCho = ticket.transferRecipientEmail || vuaChuyenCho

  return (
    <div className="min-h-[70vh] bg-stock text-ink pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8">
        <p><Link to="/my-shows" className="inline-flex items-center gap-2 min-h-[44px] text-ink-soft underline underline-offset-4 hover:text-ink"><ArrowLeft size={18} aria-hidden="true" /> Vé của tôi</Link></p>

        {/* ===== TẤM VÉ: cuống tối ghi ngày giờ, thân vé ghi buổi diễn — cùng khuôn với danh sách Vé của tôi ===== */}
        <article className="mt-3 grid sm:grid-cols-[11rem_minmax(0,1fr)] border-2 border-ink bg-card shadow-lift">
          <div className="bg-board text-lamp p-5 sm:border-r-2 sm:border-dashed sm:border-lamp/40">
            <p className="font-mono text-sm text-lamp-mute">{thuVietHoa(batDau)}</p>
            <p className="font-display text-5xl leading-none mt-1">{ngayGon(batDau)}</p>
            <p className="font-mono text-xl mt-2">{gioTrongNgay(batDau)}{ticket.showScheduledEnd ? ` – ${gioTrongNgay(ticket.showScheduledEnd)}` : ''}</p>
            <p className="font-mono text-sm text-lamp-mute mt-1">{dayjs(batDau).year()}</p>
          </div>
          <div className="relative p-5 sm:p-6 min-w-0">
            <p className="text-sm font-semibold text-ink-soft">{trucTuyen ? 'Vé xem trực tuyến' : 'Vé vào cửa'} · {tt.nhan}</p>
            <h1 className="text-4xl sm:text-5xl leading-[1.08] mt-1 break-words">{ticket.showName}</h1>
            <p className="font-display text-2xl mt-3">{ticket.loungeName}</p>
            {!trucTuyen && ticket.loungeAddress && <p className="text-ink-soft">{ticket.loungeAddress}</p>}
            <p className="mt-3"><span className="font-semibold">{ticket.tierName}</span>{ticket.priceName && ticket.priceName !== ticket.tierName ? ` · ${ticket.priceName}` : ''}</p>
            {ticket.physicalDetail && (
              <p className="text-ink-soft">Chỗ ngồi: <span className="text-ink font-semibold">{ticket.physicalDetail.seatInfo || 'không xếp chỗ cố định'}</span></p>
            )}
            {tt.dau && <DauMoc vongNgoai="MUSICLOUNGE · TIỀN VÉ · " giua={tt.dau} size={84} className="mt-4 sm:mt-0 sm:absolute sm:right-5 sm:bottom-5" />}
          </div>
        </article>

        {hoanDu && ticket.status === 'Confirmed' && (
          <div role="status" className="mt-5 border-l-4 border-ink bg-sunken p-4">
            <p className="font-semibold">Phòng trà đã đổi lịch hoặc địa chỉ sau khi bạn mua vé.</p>
            <p className="text-ink-soft mt-0.5">Bạn được huỷ vé và hoàn 100% tiền tới {gioTrongNgay(hoanDu)} ngày {ngayDayDu(hoanDu)}, không phụ thuộc chính sách của buổi diễn.</p>
          </div>
        )}

        {/* ===== LỐI VÀO: mã QR (vé tại chỗ đã thanh toán) / xem trực tuyến / lời giải thích ===== */}
        <section aria-labelledby="loi-vao-td" className="mt-8 border-2 border-ink bg-card p-5 sm:p-8">
          {coMaVaoCua ? (
            <div className="flex flex-col items-center text-center">
              <h2 id="loi-vao-td" className="text-3xl">Mã vào cửa</h2>
              <p className="text-ink-soft mt-1">Đưa mã này cho nhân viên soát vé ở cửa phòng trà.</p>
              {/* Nền TRẮNG thuần và lề 24px quanh mã: máy quét cần ô đậm trên nền sáng và một vùng trống bao quanh. */}
              <div className="mt-5 p-6 bg-white border border-ink">
                <QRCode value={maQr} size={220} level="M" fgColor="#000000" bgColor="#FFFFFF" title={`Mã QR vào cửa của vé ${ticket.showName}`} />
              </div>
              <p className="mt-4 text-sm text-ink-soft">Máy quét không đọc được? Đọc dãy mã này cho nhân viên:</p>
              <p className="font-mono text-sm break-all mt-1 select-all">{maQr}</p>
            </div>
          ) : (
            <>
              <h2 id="loi-vao-td" className="text-3xl">
                {ticket.status === 'Used' ? 'Vé đã được soát'
                  : ticket.status === 'Pending' ? 'Vé chưa thanh toán'
                    : ticket.status === 'Cancelled' ? 'Vé đã huỷ'
                      : ticket.status === 'Refunded' ? 'Vé đã hoàn tiền'
                        : 'Xem trực tuyến'}
              </h2>
              <p className="text-ink-soft mt-2">
                {ticket.status === 'Used' ? (daVao ? `Đã vào cửa lúc ${gioTrongNgay(daVao)} ngày ${ngayDayDu(daVao)}.` : 'Vé này đã được dùng.')
                  : ticket.status === 'Pending' ? 'Vé này chưa được thanh toán nên chưa có mã vào cửa.'
                    : ticket.status === 'Cancelled' ? 'Vé này không còn hiệu lực và không dùng để vào cửa được.'
                      : ticket.status === 'Refunded' ? 'Tiền vé đã được hoàn. Vé không còn hiệu lực.'
                        : 'Vé này dùng để xem buổi diễn qua mạng, không cần mã vào cửa.'}
              </p>
            </>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {trucTuyen && ['Confirmed', 'Used'].includes(ticket.status) && ticket.showId != null && (
              <Link to={`/livestream/${ticket.showId}`} className={NUT_DAC}>Vào xem trực tuyến</Link>
            )}
            {ticket.showId != null && <Link to={`/shows/${ticket.showId}`} className={NUT_VIEN}>Xem trang buổi diễn</Link>}
          </div>
        </section>

        {/* ===== CHI TIẾT ===== */}
        <section aria-labelledby="chi-tiet-td" className="mt-10">
          <h2 id="chi-tiet-td" className="text-3xl mb-3">Chi tiết vé</h2>
          <dl className="border-y-2 border-ink">
            <Muc nhan="Trạng thái">{tt.nhan}</Muc>
            <Muc nhan="Loại vé">{trucTuyen ? 'Xem trực tuyến' : 'Tại phòng trà'}</Muc>
            <Muc nhan="Hạng vé">{ticket.tierName}{ticket.priceName && ticket.priceName !== ticket.tierName ? ` · ${ticket.priceName}` : ''}</Muc>
            <Muc nhan="Số tiền đã trả"><span className="font-mono">{tien(ticket.pricePaid)}</span></Muc>
            <Muc nhan="Ngày đặt"><span className="font-mono">{gioTrongNgay(ticket.purchasedAt)} {ngayDayDu(ticket.purchasedAt)}</span></Muc>
            {ticket.physicalDetail && (
              <Muc nhan="Vào cửa">{daVao ? <span className="font-mono">{gioTrongNgay(daVao)} {ngayDayDu(daVao)}</span> : 'Chưa soát vé'}</Muc>
            )}
            <Muc nhan="Mã vé"><span className="font-mono text-sm font-normal">{ticket.id}</span></Muc>
          </dl>
        </section>

        {/* ===== CHUYỂN VÉ — vé KHÔNG sang tay ngay khi bấm gửi: người nhận phải tự đồng ý ===== */}
        {ticket.status === 'Confirmed' && (
          <section aria-labelledby="chuyen-ve-td" className="mt-10">
            <h2 id="chuyen-ve-td" className="text-3xl mb-2">Chuyển vé cho người khác</h2>
            {dangChoChuyen ? (
              <>
                <p className="text-ink-soft mb-4">
                  Đang chờ người nhận đồng ý{emailCho && <> (<span className="font-semibold text-ink break-all">{emailCho}</span>)</>}. Vé vẫn thuộc về bạn cho tới khi họ nhận.
                </p>
                <button type="button" onClick={handleCancelTransfer} disabled={busyTransfer !== null} className={NUT_VIEN}>
                  {busyTransfer === 'cancel' && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Huỷ lượt chuyển
                </button>
              </>
            ) : (
              <form onSubmit={handleTransfer} noValidate>
                <label htmlFor="email-nguoi-nhan" className="block font-semibold">Email người nhận</label>
                <p id="email-nguoi-nhan-goi-y" className="text-sm text-ink-soft mb-1.5">Họ phải đã có tài khoản trên MusicLounge và phải tự bấm nhận vé.</p>
                <div className="flex flex-wrap gap-3">
                  <input id="email-nguoi-nhan" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={recipientEmail}
                    onChange={(e) => { setRecipientEmail(e.target.value); setLoiChuyen(null) }}
                    aria-invalid={loiChuyen ? 'true' : undefined} aria-describedby={`email-nguoi-nhan-goi-y${loiChuyen ? ' email-nguoi-nhan-loi' : ''}`}
                    className={`flex-1 min-w-[14rem] min-h-[48px] px-4 bg-card border-2 text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock ${loiChuyen ? 'border-danger' : 'border-ink'}`} />
                  <button type="submit" disabled={busyTransfer !== null} className={NUT_DAC}>
                    {busyTransfer === 'send' && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Gửi vé
                  </button>
                </div>
                {loiChuyen && <p id="email-nguoi-nhan-loi" role="alert" className="mt-1.5 text-sm font-semibold text-danger">{loiChuyen}</p>}
              </form>
            )}
          </section>
        )}

        {/* ===== HUỶ VÉ — vé Confirmed huỷ xong KHÔNG hoàn tiền ngay: backend tạo yêu cầu hoàn tiền để Admin duyệt,
            mức hoàn theo chính sách của buổi diễn. Vé Pending (chưa từng thanh toán) thì huỷ đứt luôn. ===== */}
        {['Confirmed', 'Pending'].includes(ticket.status) && (
          <section aria-labelledby="huy-ve-td" className="mt-10">
            <h2 id="huy-ve-td" className="text-3xl mb-2">Huỷ vé</h2>
            <p className="text-ink-soft mb-4">
              {ticket.status === 'Confirmed'
                ? (hoanDu ? 'Huỷ trước mốc ở trên thì được hoàn 100%. Yêu cầu hoàn tiền được gửi tới quản trị viên để duyệt.'
                  : 'Huỷ vé sẽ tạo yêu cầu hoàn tiền gửi tới quản trị viên. Số tiền hoàn theo đúng chính sách của buổi diễn.')
                : 'Vé này chưa thanh toán nên huỷ sẽ có hiệu lực ngay.'}
            </p>
            <button type="button" onClick={() => setMoHuy(true)} className="inline-flex items-center min-h-[48px] px-5 border-2 border-danger text-danger font-semibold hover:bg-danger hover:text-lamp transition-colors">
              Huỷ vé này
            </button>
          </section>
        )}
      </div>

      <HopXacNhan mo={moHuy} tieuDe="Huỷ vé này?" nhanXacNhan="Huỷ vé này" nhanGiu="Không, giữ vé" dangXuLy={isCancelling}
        onDong={() => setMoHuy(false)} onXacNhan={handleCancel}>
        <p><span className="font-semibold text-ink">{ticket.showName}</span> · {ticket.tierName} · {tien(ticket.pricePaid)}</p>
        <p className="mt-2">
          {ticket.status === 'Confirmed'
            ? 'Vé sẽ không dùng để vào cửa được nữa. Tiền hoàn theo chính sách của buổi diễn và cần quản trị viên duyệt.'
            : 'Vé chưa thanh toán sẽ bị huỷ ngay và chỗ được trả lại cho người khác.'}
        </p>
      </HopXacNhan>
    </div>
  )
}

export default TicketDetailPage
