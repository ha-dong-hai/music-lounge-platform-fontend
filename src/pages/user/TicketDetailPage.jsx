import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Video, ExternalLink, Clock, MapPin, Ticket, Send, XCircle } from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { showService } from '../../services/showService'
import { useAuthStore } from '../../store/useAuthStore'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const TicketDetailPage = () => {
  const { ticketId } = useParams()
  const { user } = useAuthStore()
  const [ticket, setTicket] = useState(null)
  const [show, setShow] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const fetchTicket = async () => {
      setIsLoading(true)
      try {
        const res = await ticketService.getTicketDetail(ticketId)
        if (res.success && res.data) {
          setTicket(res.data)
          // Also fetch show details
          if (res.data.showId) {
            const showRes = await showService.getDetail(res.data.showId).catch(() => null)
            if (showRes?.success) setShow(showRes.data)
          }
        }
      } catch (err) {
        console.error('Failed to fetch ticket:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTicket()
  }, [ticketId])

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy vé này?')) return
    setIsCancelling(true)
    try {
      await ticketService.cancelTicket(ticketId)
      toast.success('Đã hủy vé thành công')
      setTicket(prev => ({ ...prev, status: 'Cancelled' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy vé')
    } finally {
      setIsCancelling(false)
    }
  }

  const formatPrice = (price) => price ? `${Number(price).toLocaleString('vi-VN')}đ` : '—'

  const getStatusBadge = (status) => {
    const map = {
      Active: { label: 'Đã xác nhận', color: 'green', icon: CheckCircle2 },
      Used: { label: 'Đã sử dụng', color: 'blue', icon: CheckCircle2 },
      Cancelled: { label: 'Đã hủy', color: 'red', icon: XCircle },
      Expired: { label: 'Hết hạn', color: 'gray', icon: Clock },
      PendingTransfer: { label: 'Đang chuyển nhượng', color: 'yellow', icon: Send },
    }
    const info = map[status] || { label: status || 'N/A', color: 'gray', icon: Ticket }
    const Icon = info.icon
    return (
      <span className={`inline-flex items-center gap-1.5 bg-${info.color}-500/15 text-${info.color}-400 px-3 py-1 rounded-full text-xs font-bold border border-${info.color}-500/30`}>
        <Icon size={14} /> {info.label}
      </span>
    )
  }

  // Determine if show is live/upcoming
  const isShowLive = show?.status === 'Ongoing' || show?.status === 'Live'
  const isShowUpcoming = show?.scheduledStart && dayjs(show.scheduledStart).isAfter(dayjs())
  const hasLivestream = show?.livestreamId && (show.format === 'Online' || show.format === 'Hybrid')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="auth-btn-spinner text-[#C3B665]" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy vé</h1>
        <Link to="/my-shows" className="text-[#C3B665] flex items-center gap-2">
          <ArrowLeft size={18} /> Quay lại danh sách
        </Link>
      </div>
    )
  }

  const eventDate = dayjs(ticket.showScheduledStart || ticket.scheduledStart || show?.scheduledStart)

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link to="/my-shows" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#C3B665] transition-colors">
            <ArrowLeft size={18} /> Quay lại danh sách vé
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
          {ticket.showName || ticket.loungeShowName || show?.name || 'Chương trình'}
        </h1>

        {/* Cover Image */}
        {(ticket.showCoverImageUrl || show?.coverImageUrl) && (
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 bg-gray-900">
            <img
              src={ticket.showCoverImageUrl || show?.coverImageUrl}
              alt={ticket.showName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Action Buttons: Watch Livestream / View Show */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Link to show detail */}
          <Link
            to={`/shows/${ticket.showId || show?.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            <ExternalLink size={18} /> Xem chi tiết show
          </Link>

          {/* Livestream button */}
          {hasLivestream && (
            <Link
              to={`/shows/${ticket.showId || show?.id}/live`}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-colors ${
                isShowLive
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : 'bg-[#C3B665] text-black hover:bg-[#d4c87f]'
              }`}
            >
              <Video size={18} />
              {isShowLive ? '🔴 Xem Livestream ngay' : isShowUpcoming ? 'Vào phòng chờ Livestream' : 'Xem lại Livestream'}
            </Link>
          )}

          {/* Cancel ticket */}
          {ticket.status === 'Active' && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-500/30 text-red-400 rounded-lg font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {isCancelling ? <Loader2 size={18} className="auth-btn-spinner" /> : <XCircle size={18} />}
              Hủy vé
            </button>
          )}
        </div>

        {/* Ticket Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div>
              <p className="text-gray-500 text-sm mb-1">Loại vé</p>
              <p className="text-white font-bold text-lg">{ticket.tierName || ticket.ticketTierName || '—'}</p>
            </div>
            <div className="sm:border-l sm:border-gray-800 sm:pl-6">
              <p className="text-gray-500 text-sm mb-1">Trạng thái</p>
              {getStatusBadge(ticket.status)}
            </div>
            <div className="sm:border-l sm:border-gray-800 sm:pl-6">
              <p className="text-gray-500 text-sm mb-1">Thời gian</p>
              <p className="text-white font-bold text-lg">
                {eventDate.isValid() ? eventDate.format('HH:mm DD/MM/YYYY') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center">
          <p className="text-white font-bold text-lg mb-4">Mã QR Check-in</p>
          <div className="p-4 bg-black border-2 border-[#C3B665] rounded-xl">
            <QRCodeSVG
              value={ticket.qrCode || `TICKET-${ticketId}`}
              size={180}
              level="H"
              fgColor="#ffffff"
              bgColor="#000000"
            />
          </div>
          <p className="text-gray-500 font-mono text-sm mt-4">
            {ticket.ticketCode || ticket.qrCode || ticketId}
          </p>
          <p className="text-gray-400 text-xs mt-1">Chìa màn hình này cho nhân viên soát vé tại cửa</p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-[#C3B665] mb-4">Chi tiết đơn hàng</h2>
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="p-4 text-gray-500 text-sm w-1/3">Ngày mua</td>
                  <td className="p-4 text-white text-sm">
                    {ticket.purchasedAt ? dayjs(ticket.purchasedAt).format('HH:mm DD/MM/YYYY') : '—'}
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-4 text-gray-500 text-sm">Giá vé</td>
                  <td className="p-4 text-[#C3B665] font-bold">{formatPrice(ticket.pricePaid || ticket.price)}</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-4 text-gray-500 text-sm">Địa điểm</td>
                  <td className="p-4 text-white text-sm flex items-center gap-2">
                    <MapPin size={14} className="text-[#C3B665]" />
                    {ticket.loungeName || show?.loungeName || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-500 text-sm">Người mua</td>
                  <td className="p-4 text-white text-sm">{user?.fullName || user?.email || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetailPage