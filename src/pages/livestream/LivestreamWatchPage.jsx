// src/pages/livestream/LivestreamWatchPage.jsx
// Trang xem livestream THẬT: HLS + SignalR (chat/donate/viewer) + vé PPV (heartbeat) + donate VNPay.
// Page giữ state & logic; UI chia nhỏ: LivestreamHeader, LivestreamStage, LivestreamScreens,
// TerminateModal (cắt sóng Admin) + ChatPanel / RatingModal có sẵn.
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import ChatPanel from '../../components/livestream/ChatPanel'
import RatingModal from '../../components/livestream/RatingModal'
import LivestreamHeader from '../../components/livestream/LivestreamHeader'
import LivestreamStage from '../../components/livestream/LivestreamStage'
import TerminateModal from '../../components/livestream/TerminateModal'
import { LivestreamLoadingScreen, LivestreamErrorScreen, LivestreamAccessScreen } from '../../components/livestream/LivestreamScreens'
import { getShowDetail, rateShow } from '../../services/showServices'
import { getLivestreamDetail, getChatHistory, sendHeartbeat, terminateLivestream } from '../../services/livestreamServices'
import { createDonation } from '../../services/donationServices'
import { submitContentReport } from '../../services/contentReportServices'
import { getLoungeTour } from '../../services/loungeServices'
import { useAuthStore } from '../../store/useAuthStore'
import { useLivestreamHub } from '../../hooks/useLivestreamHub'
import { useAutoShowRating } from '../../hooks/useAutoShowRating'

const HEARTBEAT_INTERVAL_MS = 30000

const LivestreamWatchPage = () => {
  const { showId } = useParams()
  const { user } = useAuthStore()

  const [showData, setShowData] = useState(null)
  const [livestream, setLivestream] = useState(null) // LivestreamDetailDto thật
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [viewerCount, setViewerCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [donationAlerts, setDonationAlerts] = useState([])
  const [tourScenes, setTourScenes] = useState([])

  // Cắt sóng (chỉ Admin): page giữ trạng thái mở/đang xử lý, modal tự quản lý do.
  const [moCatSong, setMoCatSong] = useState(false)
  const [dangCatSong, setDangCatSong] = useState(false)

  const heartbeatRef = useRef(null)

  // 1. Lấy show detail thật -> lấy livestreamId -> lấy chi tiết livestream thật (HlsUrl/quyền xem)
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const showRes = await getShowDetail(showId)
        if (!showRes.success) {
          setError('Không tìm thấy buổi diễn phát trực tuyến.')
          return
        }
        setShowData(showRes.data)

        if (!showRes.data.livestreamId) {
          setError('Buổi diễn này không có phiên phát trực tuyến.')
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
        setError('Không kết nối được máy chủ. Vui lòng thử lại.')
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

  // 3. Tour 360° của phòng trà tổ chức buổi diễn này (endpoint đọc là công khai).
  //    Lỗi thì coi như không có tour — nút "Ngồi tại phòng trà" đơn giản là không hiện.
  const loungeId = showData?.lounge?.id
  useEffect(() => {
    if (!loungeId) return
    let bo = false
    getLoungeTour(loungeId)
      .then((r) => { if (!bo && r.success) setTourScenes((r.data?.scenes ?? []).filter((sc) => sc.imageUrl)) })
      .catch(() => {})
    return () => { bo = true }
  }, [loungeId])

  // 4. Kết nối SignalR thật (chỉ khi có quyền xem)
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

  // 5. Tự mở modal đánh giá sau khi buổi diễn kết thúc (1 lần mỗi show, mỗi user)
  const { showRatingModal, openRating, closeRating } = useAutoShowRating({ showData, showId, user })

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

  // CẮT SÓNG — xem comment đầu TerminateModal.jsx
  const handleCatSong = async (reason) => {
    setDangCatSong(true)
    try {
      await terminateLivestream(livestream.id, reason)
      toast.success('Đã cắt sóng buổi phát này.')
      setMoCatSong(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không cắt được sóng.')
    } finally {
      setDangCatSong(false)
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

  // ===== MÀN FULL-PAGE =====
  if (isLoading) return <LivestreamLoadingScreen />
  if (error) return <LivestreamErrorScreen message={error} />
  if (livestream && !livestream.userHasAccess) {
    return <LivestreamAccessScreen showId={showId} />
  }

  // ===== TRANG CHÍNH =====
  return (
    <div className="h-screen bg-page text-ink flex flex-col overflow-hidden">
      <LivestreamHeader
        showId={showId}
        showName={showData?.name}
        viewerCount={viewerCount}
        connectionState={connectionState}
        onEndClick={openRating}
        canTerminate={user?.role === 'Admin' && !!livestream?.id}
        onTerminateClick={() => setMoCatSong(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-page relative">
          <LivestreamStage
            livestream={livestream}
            tourScenes={tourScenes}
            donationAlerts={donationAlerts}
            onAlertEnd={handleRemoveAlert}
          />
        </div>

        <div className="w-[300px] sm:w-[350px] lg:w-[400px] flex-none border-l border-line flex flex-col bg-card">
          <ChatPanel
            messages={messages}
            performers={showData?.performers || []}
            onSendMessage={handleSendMessage}
            onSendDonation={handleSendDonation}
            onReport={handleReport}
          />
        </div>
      </div>

      {moCatSong && (
        <TerminateModal
          isProcessing={dangCatSong}
          onClose={() => setMoCatSong(false)}
          onConfirm={handleCatSong}
        />
      )}

      {showRatingModal && (
        <RatingModal showName={showData?.name} onClose={closeRating} onSubmit={handleRateSubmit} />
      )}
    </div>
  )
}

export default LivestreamWatchPage