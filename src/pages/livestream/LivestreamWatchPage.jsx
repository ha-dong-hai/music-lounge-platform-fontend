import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, WifiOff, Eye, Square, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import StreamPlayer from '../../components/livestream/StreamPlayer'
import ChatPanel from '../../components/livestream/ChatPanel'
import { getShowDetail, rateShow } from '../../services/showServices'
import { getLivestreamDetail, getChatHistory, sendHeartbeat } from '../../services/livestreamServices'
import { createDonation } from '../../services/donationServices'
import { submitContentReport } from '../../services/contentReportServices'
import { useAuthStore } from '../../store/useAuthStore'
import { useLivestreamHub } from '../../hooks/useLivestreamHub'

import RatingModal from '../../components/livestream/RatingModal'
import { formatCompactNumber } from '../../utils/format'

const HEARTBEAT_INTERVAL_MS = 30000

const LivestreamWatchPage = () => {
  const { showId } = useParams()
  const { user } = useAuthStore()

  const [showData, setShowData] = useState(null)
  const [livestream, setLivestream] = useState(null) // LivestreamDetailDto thật
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showRatingModal, setShowRatingModal] = useState(false)

  const [viewerCount, setViewerCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [donationAlerts, setDonationAlerts] = useState([])

  const heartbeatRef = useRef(null)

  // 1. Lấy show detail thật -> lấy livestreamId -> lấy chi tiết livestream thật (HlsUrl/quyền xem)
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const showRes = await getShowDetail(showId)
        if (!showRes.success) {
          setError('Streaming show not found.')
          return
        }
        setShowData(showRes.data)

        if (!showRes.data.livestreamId) {
          setError('This show has no livestream session.')
          return
        }

        const lsRes = await getLivestreamDetail(showRes.data.livestreamId)
        if (lsRes.success) {
          setLivestream(lsRes.data)
          setViewerCount(lsRes.data.viewerCount || 0)
        }

        try {
          const chatRes = await getChatHistory(showRes.data.livestreamId, { pageSize: 50 })
          if (chatRes.success) {
            setMessages(
              chatRes.data.items.map((m) => ({
                user: { name: m.displayName, avatarUrl: null },
                content: m.message,
                type: 'chat',
                isMine: m.userId === user?.id,
              }))
            )
          }
        } catch {
          // Lịch sử chat không tải được không nên chặn cả trang — vẫn xem được livestream/chat mới.
        }
      } catch {
        setError('Server connection error.')
      } finally {
        setIsLoading(false)
      }
    }
    initData()
  }, [showId, user?.id])

  // 2. Giữ phiên xem sống (chỉ khi có ViewingSessionId thật — vé PPV thật)
  useEffect(() => {
    if (!livestream?.viewingSessionId) return
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(livestream.id, livestream.viewingSessionId).catch(() => {})
    }, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(heartbeatRef.current)
  }, [livestream?.id, livestream?.viewingSessionId])

  // 3. Kết nối SignalR thật
  const { connectionState, sendMessage: hubSendMessage } = useLivestreamHub(
    livestream?.userHasAccess ? livestream.id : null,
    {
      onReceiveMessage: (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            user: { name: msg.displayName, avatarUrl: null },
            content: msg.message,
            type: 'chat',
            isMine: msg.userId === user?.id,
          },
        ])
      },
      onDonationAlert: (donation) => {
        // DonationAlertDto thật: { donorName, amount, message, donationId } — không có tên nghệ sĩ.
        const entry = {
          id: donation.donationId,
          user: { name: donation.donorName, avatarUrl: null },
          amount: donation.amount,
          message: donation.message,
        }
        setMessages((prev) => [...prev, { ...entry, type: 'donate' }])
        setDonationAlerts((prev) => [...prev.slice(-4), entry])
      },
      onDonationMessageHidden: ({ donationId }) => {
        setMessages((prev) => prev.filter((m) => m.id !== donationId))
        setDonationAlerts((prev) => prev.filter((a) => a.id !== donationId))
      },
      onViewerCountUpdated: ({ count }) => setViewerCount(count),
      onTerminated: () => toast.error('Buổi livestream đã bị dừng bởi quản trị viên.'),
      onFailed: () => toast.error('Kết nối livestream gặp sự cố.'),
    }
  )

  useEffect(() => {
    if (!showData) return
    if (!user) return
    if (localStorage.getItem(`rated_show_${showId}`)) return

    const hasEnded = () => {
      if (showData.scheduledEnd) return new Date() > new Date(showData.scheduledEnd)
      if (showData.status) return String(showData.status).toLowerCase() === 'ended'
      return false
    }

    let modalTimer = null
    let interval = null

    const triggerIfEnded = () => {
      if (hasEnded()) {
        if (interval) clearInterval(interval)
        modalTimer = setTimeout(() => setShowRatingModal(true), 3000)
        return true
      }
      return false
    }

    if (!triggerIfEnded()) {
      interval = setInterval(triggerIfEnded, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (modalTimer) clearTimeout(modalTimer)
    }
  }, [showData, showId, user])

  const handleRateSubmit = async (rating, comment) => {
    try {
      await rateShow(showId, { score: rating, comment })
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Bạn đã đánh giá buổi diễn này rồi.')
        return
      }
      throw err
    }
  }

  const handleCloseRating = () => {
    setShowRatingModal(false)
    localStorage.setItem(`rated_show_${showId}`, 'true')
  }

  const handleEndStreamClick = () => {
    setShowRatingModal(true)
  }

  const handleSendMessage = async (text) => {
    try {
      await hubSendMessage(text)
    } catch {
      toast.error('Không gửi được tin nhắn, thử lại.')
    }
  }

  // Donate đi qua VNPay thật — không thêm alert cục bộ, chờ sự kiện DonationAlert dội về cho mọi người.
  const handleSendDonation = async (performerId, amount, message) => {
    const performance = showData?.performers?.find((p) => p.id === performerId)
    if (!performance?.performanceId) {
      toast.error('Không xác định được buổi trình diễn của nghệ sĩ này.')
      return
    }
    try {
      const res = await createDonation({
        performanceId: performance.performanceId,
        amount,
        message: message || null,
        isMessagePublic: true,
      })
      if (res.success && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể khởi tạo donate.')
    }
  }

  const handleReport = async (reason, description) => {
    if (!livestream?.id) {
      toast.error('Chưa xác định được buổi livestream để báo cáo.')
      return
    }
    // Backend chỉ nhận 3 mức đối tượng: Show / Livestream / Rating — KHÔNG báo cáo được từng tin
    // nhắn chat riêng lẻ, nên quy về cả buổi livestream và ghi lý do người dùng chọn vào nội dung.
    // reason tối đa 500 ký tự nên phải cắt trước khi gửi, tránh bị 400 vì lỗi độ dài.
    const fullReason = `${reason}: ${description}`.slice(0, 500)
    try {
      await submitContentReport({
        targetType: 'Livestream',
        targetId: livestream.id,
        reason: fullReason,
      })
    } catch (err) {
      // 409 = chính người này đã báo cáo buổi này và báo cáo cũ còn đang chờ Admin xử lý.
      toast.error(err.response?.data?.message || 'Không gửi được báo cáo.')
      throw err
    }
  }

  const handleRemoveAlert = (id) => {
    setDonationAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <AlertCircle size={40} className="text-red-400 mb-4" />
        <p className="text-xl mb-4">{error}</p>
        <Link to="/" className="text-[#C3B665] underline flex items-center gap-2"><ArrowLeft size={16} /> Return</Link>
      </div>
    )
  }

  if (livestream && !livestream.userHasAccess) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4 text-center">
        <Lock size={40} className="text-[#C3B665] mb-4" />
        <p className="text-xl mb-2 font-bold">You need a ticket to watch this livestream</p>
        <p className="text-gray-400 mb-6">Buy a livestream ticket for this show to unlock viewing.</p>
        <Link to={`/shows/${showId}`} className="text-[#C3B665] underline flex items-center gap-2"><ArrowLeft size={16} /> Back to show</Link>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="flex-none flex items-center gap-4 px-4 py-2.5 bg-gray-950 border-b border-gray-800 z-50">
        <Link to={`/shows/${showId}`} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors flex-shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">{showData?.name}</h1>
          <p className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span> LIVE
            </span>
            <span className="flex items-center gap-1"><Eye size={12} /> {formatCompactNumber(viewerCount)}</span>
            {connectionState !== 'connected' && (
              <span className="flex items-center gap-1 text-yellow-500">
                <WifiOff size={11} /> {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleEndStreamClick}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
          title="Kết thúc stream (test modal đánh giá)"
        >
          <Square size={12} className="fill-red-400" /> Kết thúc
        </button>

      </div>

      {/* BODY: VIDEO + CHAT */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-black relative">
          <StreamPlayer
            streamUrl={livestream?.hlsUrl}
            donationAlerts={donationAlerts}
            onAlertEnd={handleRemoveAlert}
          />
        </div>

        <div className="w-[300px] sm:w-[350px] lg:w-[400px] flex-none border-l border-gray-800 flex flex-col bg-gray-950">
          <ChatPanel
            messages={messages}
            performers={showData?.performers || []}
            onSendMessage={handleSendMessage}
            onSendDonation={handleSendDonation}
            onReport={handleReport}
          />
        </div>
      </div>

      {showRatingModal && (
        <RatingModal
          showName={showData?.name}
          onClose={handleCloseRating}
          onSubmit={handleRateSubmit}
        />
      )}

    </div>

  )
}

export default LivestreamWatchPage
