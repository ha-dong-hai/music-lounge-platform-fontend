// src/pages/user/TicketDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Send, Loader2, Undo2, CalendarDays, Video } from 'lucide-react'
import QRCode from 'react-qr-code'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getTicketDetail, cancelTicket, initiateTicketTransfer, cancelTicketTransfer } from '../../services/ticketServices'
import Skeleton from '../../components/shared/Skeleton'

const TicketDetailPage = () => {
    const { ticketId } = useParams()

    const [ticket, setTicket] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [apiError, setApiError] = useState(null)
    const [isCancelling, setIsCancelling] = useState(false)
    const [cancelDone, setCancelDone] = useState(false)

    // Chuyển nhượng vé: người nhận phải đã có tài khoản và phải TỰ ĐỒNG Ý nhận.
    // Trước khi họ đồng ý, người gửi vẫn huỷ được lượt chuyển.
    const [recipientEmail, setRecipientEmail] = useState('')
    const [busyTransfer, setBusyTransfer] = useState(null)

    const taiLaiVe = async () => {
        const res = await getTicketDetail(ticketId)
        if (res.success) setTicket(res.data)
    }

    const handleTransfer = async (e) => {
        e.preventDefault()
        if (!recipientEmail.trim()) return
        setBusyTransfer('send')
        try {
            await initiateTicketTransfer(ticketId, recipientEmail.trim())
            toast.success('Đã gửi lượt chuyển vé. Vé chỉ sang tay khi người nhận đồng ý.')
            setRecipientEmail('')
            await taiLaiVe()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không gửi được lượt chuyển vé.')
        } finally {
            setBusyTransfer(null)
        }
    }

    const handleCancelTransfer = async () => {
        setBusyTransfer('cancel')
        try {
            await cancelTicketTransfer(ticketId)
            toast.success('Đã huỷ lượt chuyển vé.')
            await taiLaiVe()
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
            const refundId = res?.data
            toast.success(refundId ? 'Đã gửi yêu cầu huỷ vé và hoàn tiền.' : 'Đã huỷ vé.')
            setCancelDone(true)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không huỷ được vé.', { duration: 6000 })
        } finally {
            setIsCancelling(false)
        }
    }

    // ⭐ GỌI API LẤY CHI TIẾT VÉ
    useEffect(() => {
        const fetchTicket = async () => {
            setIsLoading(true)
            try {
                const res = await getTicketDetail(ticketId)
                if (res.success) {
                    setTicket(res.data)
                } else {
                    setApiError('Ticket not found')
                }
            } catch (err) {
                console.error('Ticket loading error:', err)
                setApiError('Ticket information cannot be loaded.')
            } finally {
                setIsLoading(false)
            }
        }
        fetchTicket()
    }, [ticketId])

    if (isLoading) {
        return (
            <div className="min-h-[60vh] bg-page text-ink pb-16">
                <div className="max-w-3xl mx-auto px-6 py-8">
                    <Skeleton className="h-8 w-48 mb-8" />
                    <Skeleton className="h-8 w-3/4 mb-6" />
                    <Skeleton className="w-full h-64 md:h-80 rounded-2xl mb-8" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                        <Skeleton className="h-24 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                    </div>
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        )
    }

    if (apiError || !ticket) {
        return (
            <div className="min-h-[60vh] bg-page flex flex-col items-center justify-center text-ink">
                <h1 className="text-2xl font-bold mb-4">{apiError || 'Không tìm thấy vé'}</h1>
                <Link to="/my-shows" className="text-brand-text flex items-center gap-2">
                    <ArrowLeft size={18} /> Return to list
                </Link>
            </div>
        )
    }

    // Map data từ BE
    const eventDate = dayjs(ticket.showScheduledStart)
    const orderDate = dayjs(ticket.purchasedAt).format('HH:mm DD/MM/YYYY')
    const formattedPrice = ticket.pricePaid.toLocaleString('vi-VN') + 'đ'

    return (
        <div className="min-h-[60vh] bg-page text-ink pb-16">
            <div className="max-w-3xl mx-auto px-6 py-8">

                <div className="mb-8">
                    <Link to="/my-shows" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-brand-text transition-colors">
                        <ArrowLeft size={18} />
                        Return to ticket list
                    </Link>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-ink mb-3">{ticket.showName}</h1>

                {/* LỐI SANG BUỔI DIỄN — CHỈ HIỆN KHI CÓ showId.
                    TicketDetailDto trước đây KHÔNG trả showId (trong khi TicketListItemDto thì có),
                    nên từ trang này không dẫn sang buổi diễn hay chỗ xem trực tuyến được. Backend đã
                    thêm trường đó nhưng BẢN ĐANG CHẠY có thể chưa có — nên bọc điều kiện thay vì
                    dựng cứng: thiếu trường thì khối này không hiện, có trường thì tự bật. Không phải
                    sửa lại lần nữa sau khi deploy, và không bao giờ tạo link /shows/undefined.
                    Danh sách vé vẫn giữ lối vào riêng của nó — đó là đường đã chạy được từ trước. */}
                {ticket.showId != null && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    <Link
                      to={`/shows/${ticket.showId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken transition-colors"
                    >
                      <CalendarDays size={15} /> Xem trang buổi diễn
                    </Link>
                    {/* So bằng `!== 'Physical'` chứ không `=== 'Livestream'`, cho khớp quy ước đã
                        dùng ở dòng dưới và ở TicketsTab. Hôm nay enum chỉ có hai giá trị nên hai
                        cách như nhau; dùng khác quy ước của chính tệp mới là mầm lệch về sau. */}
                    {ticket.accessType !== 'Physical' && (
                      <Link
                        to={`/livestream/${ticket.showId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/40 text-purple-700 text-sm font-bold hover:bg-purple-500/25 transition-colors"
                      >
                        <Video size={15} /> Vào xem trực tuyến
                      </Link>
                    )}
                  </div>
                )}

                {/* NẾU BE CÓ TRẢ LINK ẢNH THÌ HIỆN, KHÔNG CÓ THÌ BỎ QUA */}
                {/* <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 bg-card">
          <img src={ticket.thumbnail || "..."} alt={ticket.showName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 to-transparent"></div>
        </div> */}

                {/* ================================ */}
                {/* PHẦN 2: THÔNG TIN VÉ            */}
                {/* ================================ */}
                <div className="bg-card border border-line rounded-2xl p-6 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
                        <div>
                            <p className="text-ink-mute text-sm mb-1">Hạng vé</p>
                            <p className="text-ink font-bold text-lg">{ticket.tierName}</p>
                        </div>
                        <div className="sm:border-l sm:border-line sm:pl-6">
                            <p className="text-ink-mute text-sm mb-1">Phòng trà</p>
                            <p className="text-ink font-bold text-lg">{ticket.loungeName}</p>
                        </div>
                        <div className="sm:border-l sm:border-line sm:pl-6">
                            <p className="text-ink-mute text-sm mb-1">Time</p>
                            <p className="text-ink font-bold text-lg">{eventDate.format('HH:mm DD/MM')}</p>
                        </div>
                    </div>

                    {/* CHỖ NGỒI VÀ TRẠNG THÁI VÀO CỬA — backend trả trong `physicalDetail`, trước
                        đây trang này không đọc khối đó. Nghĩa là người mua vé tại chỗ KHÔNG BIẾT
                        mình được xếp chỗ nào, và cũng không biết vé đã bị quét chưa.
                        Cả hai chỉ có ở vé tại chỗ; vé xem trực tuyến thì `physicalDetail` là null. */}
                    {ticket.physicalDetail && (
                      <div className="mt-5 pt-5 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-5 text-center sm:text-left">
                        <div>
                          <p className="text-ink-mute text-sm mb-1">Chỗ ngồi</p>
                          <p className="text-ink font-bold text-lg">
                            {ticket.physicalDetail.seatInfo || 'Không xếp chỗ cố định'}
                          </p>
                        </div>
                        <div className="sm:border-l sm:border-line sm:pl-6">
                          <p className="text-ink-mute text-sm mb-1">Vào cửa</p>
                          {ticket.physicalDetail.checkedInAt ? (
                            <p className="text-success font-bold text-lg inline-flex items-center gap-1.5">
                              <CheckCircle2 size={17} />
                              {dayjs(ticket.physicalDetail.checkedInAt).format('HH:mm DD/MM/YYYY')}
                            </p>
                          ) : (
                            <p className="text-ink-soft font-bold text-lg">Chưa quét mã</p>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* PHẦN MÃ QR ĐỂ QUÉT CỬA (DÙNG MÃ QR THẬT TỪ BE) */}
                <div className="bg-card rounded-2xl p-8 mb-6 flex flex-col items-center justify-center">
                    <p className="text-ink font-bold text-lg mb-4">QR code Check-in</p>
                    <div className="p-4 bg-page border-2 border-brand rounded-xl">
                        <QRCode
                            value={ticket.qrCode || ticket.id}
                            size={180}
                            level="H"
                            fgColor="#ffffff"
                            bgColor="#000000"
                        />
                    </div>
                    <p className="text-ink-mute font-mono text-sm mt-4 break-all px-4 text-center">{ticket.id}</p>
                    <p className="text-ink-soft text-xs mt-1">Show this screen to the ticket staff at the entrance</p>
                </div>

                {/* ================================ */}
                {/* PHẦN 3: CHI TIẾT ĐƠN HÀNG        */}
                {/* ================================ */}
                <div className="bg-card border border-line rounded-2xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-brand-text">Order detail</h2>
                        <span className="text-ink-soft font-mono text-xs break-all">Order code: {ticket.id}</span>
                    </div>

                    <div className="border border-line rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <tbody>
                                <tr className="border-b border-line">
                                    <td className="p-4 text-ink-mute text-sm align-top w-1/3">Order date</td>
                                    <td className="p-4 text-ink text-sm">{orderDate}</td>
                                </tr>
                                <tr className="border-b border-line">
                                    <td className="p-4 text-ink-mute text-sm align-top">Ticket type</td>
                                    <td className="p-4 text-ink text-sm">
                                        {ticket.accessType === 'Physical' ? 'Vé trực tiếp (Offline)' : 'Vé Livestream (Online)'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-ink-mute text-sm align-top">Order status</td>
                                    <td className="p-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 bg-green-500/15 text-success px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                                            <CheckCircle2 size={14} /> {ticket.status === 'Confirmed' ? 'Paid' : ticket.status}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-card border border-line rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-brand-text mb-4">Chi tiết vé</h2>

                    <div className="border border-line rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-espresso/40">
                                <tr>
                                    <th className="p-4 text-ink-soft font-medium text-sm">Hạng vé</th>
                                    <th className="p-4 text-ink-soft font-medium text-sm text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-line">
                                    <td className="p-4 text-ink">
                                        <p className="font-medium">{ticket.tierName} - {ticket.showName}</p>
                                        <p className="text-ink-mute text-xs mt-1">{ticket.priceName}</p>
                                    </td>
                                    <td className="p-4 text-ink font-bold text-right">{formattedPrice}</td>
                                </tr>
                                <tr className="border-t-2 border-line bg-espresso/20">
                                    <td className="p-4 text-ink font-bold">Tổng cộng</td>
                                    <td className="p-4 text-brand-text font-bold text-right text-lg">{formattedPrice}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* HUỶ VÉ — chỉ hiện với vé còn hiệu lực. Vé Confirmed huỷ xong KHÔNG hoàn tiền ngay:
                    backend tạo một yêu cầu hoàn tiền để Admin duyệt, mức hoàn theo đúng chính sách
                    của buổi diễn. Vé Pending (chưa từng thanh toán thật) thì huỷ đứt luôn. */}
                {/* CHUYỂN NHƯỢNG VÉ — vé KHÔNG sang tay ngay khi bấm gửi: người nhận phải tự đồng ý,
                    và trước lúc đó người gửi vẫn huỷ được lượt chuyển. */}
                {ticket.status === 'Confirmed' && (
                    <div className="bg-card border border-line rounded-2xl p-6 mt-6">
                        <h2 className="text-xl font-bold text-brand-text mb-2">Chuyển vé cho người khác</h2>
                        {ticket.transferPending ? (
                            <>
                                <p className="text-ink-soft text-sm mb-4">
                                    Đang chờ người nhận đồng ý
                                    {ticket.transferRecipientEmail && <> (<span className="text-ink-soft">{ticket.transferRecipientEmail}</span>)</>}.
                                    Vé vẫn thuộc về bạn cho tới khi họ nhận.
                                </p>
                                <button onClick={handleCancelTransfer} disabled={busyTransfer !== null}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken disabled:opacity-50">
                                    {busyTransfer === 'cancel' ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
                                    Huỷ lượt chuyển
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-ink-soft text-sm mb-4">
                                    Nhập email người nhận. Họ phải đã có tài khoản trên hệ thống và phải tự bấm nhận vé.
                                </p>
                                <form onSubmit={handleTransfer} className="flex flex-wrap gap-2">
                                    <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        className="flex-1 min-w-[200px] px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50" />
                                    <button type="submit" disabled={busyTransfer !== null || !recipientEmail.trim()}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-50">
                                        {busyTransfer === 'send' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        Gửi vé
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                )}

                {['Confirmed', 'Pending'].includes(ticket.status) && (
                    <div className="bg-card border border-line rounded-2xl p-6 mt-6">
                        <h2 className="text-xl font-bold text-brand-text mb-2">Huỷ vé</h2>
                        <p className="text-ink-soft text-sm mb-4">
                            {ticket.status === 'Confirmed'
                                ? 'Huỷ vé sẽ tạo yêu cầu hoàn tiền gửi tới quản trị viên. Số tiền hoàn theo đúng chính sách của buổi diễn.'
                                : 'Vé này chưa thanh toán nên huỷ sẽ có hiệu lực ngay.'}
                        </p>
                        {cancelDone ? (
                            <p className="text-success text-sm">Đã gửi yêu cầu huỷ vé.</p>
                        ) : (
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-danger text-sm font-bold hover:bg-red-500/10 disabled:opacity-50"
                            >
                                <XCircle size={16} /> {isCancelling ? 'Đang gửi...' : 'Huỷ vé này'}
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}

export default TicketDetailPage