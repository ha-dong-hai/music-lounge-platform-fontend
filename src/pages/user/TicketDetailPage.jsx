// src/pages/user/TicketDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import QRCode from 'react-qr-code'
import dayjs from 'dayjs'
import { getTicketDetail } from '../../services/ticketServices'
import Skeleton from '../../components/shared/Skeleton'

const TicketDetailPage = () => {
    const { ticketId } = useParams()

    const [ticket, setTicket] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [apiError, setApiError] = useState(null)

    // ⭐ GỌI API LẤY CHI TIẾT VÉ
    useEffect(() => {
        const fetchTicket = async () => {
            setIsLoading(true)
            try {
                const res = await getTicketDetail(ticketId)
                if (res.success) {
                    setTicket(res.data)
                } else {
                    setApiError('Không tìm thấy vé')
                }
            } catch (err) {
                console.error('Lỗi tải vé:', err)
                setApiError('Không thể tải thông tin vé.')
            } finally {
                setIsLoading(false)
            }
        }
        fetchTicket()
    }, [ticketId])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white pb-16">
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
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <h1 className="text-2xl font-bold mb-4">{apiError || 'Không tìm thấy vé'}</h1>
                <Link to="/my-shows" className="text-[#C3B665] flex items-center gap-2">
                    <ArrowLeft size={18} /> Quay lại danh sách
                </Link>
            </div>
        )
    }

    // Map data từ BE
    const eventDate = dayjs(ticket.showScheduledStart)
    const orderDate = dayjs(ticket.purchasedAt).format('HH:mm DD/MM/YYYY')
    const formattedPrice = ticket.pricePaid.toLocaleString('vi-VN') + 'đ'

    return (
        <div className="min-h-screen bg-black text-white pb-16">
            <div className="max-w-3xl mx-auto px-6 py-8">

                <div className="mb-8">
                    <Link to="/my-shows" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#C3B665] transition-colors">
                        <ArrowLeft size={18} />
                        Quay lại danh sách vé
                    </Link>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{ticket.showName}</h1>

                {/* NẾU BE CÓ TRẢ LINK ẢNH THÌ HIỆN, KHÔNG CÓ THÌ BỎ QUA */}
                {/* <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 bg-gray-900">
          <img src={ticket.thumbnail || "..."} alt={ticket.showName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div> */}

                {/* ================================ */}
                {/* PHẦN 2: THÔNG TIN VÉ            */}
                {/* ================================ */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Loại vé</p>
                            <p className="text-white font-bold text-lg">{ticket.tierName}</p>
                        </div>
                        <div className="sm:border-l sm:border-gray-800 sm:pl-6">
                            <p className="text-gray-500 text-sm mb-1">Phòng trà</p>
                            <p className="text-white font-bold text-lg">{ticket.loungeName}</p>
                        </div>
                        <div className="sm:border-l sm:border-gray-800 sm:pl-6">
                            <p className="text-gray-500 text-sm mb-1">Thời gian</p>
                            <p className="text-white font-bold text-lg">{eventDate.format('HH:mm DD/MM')}</p>
                        </div>
                    </div>
                </div>

                {/* PHẦN MÃ QR ĐỂ QUÉT CỬA (DÙNG MÃ QR THẬT TỪ BE) */}
                <div className="bg-gray-900 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-lg mb-4">Mã QR Check-in</p>
                    <div className="p-4 bg-black border-2 border-[#C3B665] rounded-xl">
                        <QRCode
                            value={ticket.qrCode || ticket.id}
                            size={180}
                            level="H"
                            fgColor="#ffffff"
                            bgColor="#000000"
                        />
                    </div>
                    <p className="text-gray-500 font-mono text-sm mt-4 break-all px-4 text-center">{ticket.id}</p>
                    <p className="text-gray-400 text-xs mt-1">Chìa màn hình này cho nhân viên soát vé tại cửa</p>
                </div>

                {/* ================================ */}
                {/* PHẦN 3: CHI TIẾT ĐƠN HÀNG        */}
                {/* ================================ */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[#C3B665]">Chi tiết đơn hàng</h2>
                        <span className="text-gray-400 font-mono text-xs break-all">Mã ĐH: {ticket.id}</span>
                    </div>

                    <div className="border border-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <tbody>
                                <tr className="border-b border-gray-800">
                                    <td className="p-4 text-gray-500 text-sm align-top w-1/3">Ngày đặt đơn hàng</td>
                                    <td className="p-4 text-white text-sm">{orderDate}</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="p-4 text-gray-500 text-sm align-top">Hình thức vé</td>
                                    <td className="p-4 text-white text-sm">
                                        {ticket.accessType === 'Physical' ? 'Vé trực tiếp (Offline)' : 'Vé Livestream (Online)'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-gray-500 text-sm align-top">Tình trạng đơn hàng</td>
                                    <td className="p-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 bg-green-500/15 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                                            <CheckCircle2 size={14} /> {ticket.status === 'Confirmed' ? 'Đã thanh toán' : ticket.status}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-[#C3B665] mb-4">Thông tin đơn hàng</h2>

                    <div className="border border-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-black/40">
                                <tr>
                                    <th className="p-4 text-gray-400 font-medium text-sm">Loại vé</th>
                                    <th className="p-4 text-gray-400 font-medium text-sm text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-gray-800">
                                    <td className="p-4 text-white">
                                        <p className="font-medium">{ticket.tierName} - {ticket.showName}</p>
                                        <p className="text-gray-500 text-xs mt-1">{ticket.priceName}</p>
                                    </td>
                                    <td className="p-4 text-white font-bold text-right">{formattedPrice}</td>
                                </tr>
                                <tr className="border-t-2 border-gray-700 bg-black/20">
                                    <td className="p-4 text-white font-bold">Tổng cộng</td>
                                    <td className="p-4 text-[#C3B665] font-bold text-right text-lg">{formattedPrice}</td>
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