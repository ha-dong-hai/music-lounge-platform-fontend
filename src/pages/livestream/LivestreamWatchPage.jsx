import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, WifiOff, Eye, Square, Lock, ShieldOff, X, Sofa, Theater } from 'lucide-react'
import toast from 'react-hot-toast'
import StreamPlayer from '../../components/livestream/StreamPlayer'
import ChatPanel from '../../components/livestream/ChatPanel'
import { getShowDetail, rateShow } from '../../services/showServices'
import { getLivestreamDetail, getChatHistory, sendHeartbeat, terminateLivestream } from '../../services/livestreamServices'
import { createDonation } from '../../services/donationServices'
import { submitContentReport } from '../../services/contentReportServices'
import { useAuthStore } from '../../store/useAuthStore'
import { useLivestreamHub } from '../../hooks/useLivestreamHub'

import RatingModal from '../../components/livestream/RatingModal'
import { formatCompactNumber } from '../../utils/format'
import { getLoungeTour } from '../../services/loungeServices'

// Chế độ "ngồi tại phòng trà" kéo theo three.js (~500KB) — chỉ tải khi người xem BẬT nó.
const PanoramaViewer = lazy(() => import('../../components/lounge/PanoramaViewer'))

const HEARTBEAT_INTERVAL_MS = 30000

const LivestreamWatchPage = () => {
  const { showId } = useParams()
  const { user } = useAuthStore()

  const [showData, setShowData] = useState(null)
  const [livestream, setLivestream] = useState(null) // LivestreamDetailDto thật
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showRatingModal, setShowRatingModal] = useState(false)

  // CHẾ ĐỘ "NGỒI TẠI PHÒNG TRÀ": xung quanh là toàn cảnh 360° thật của phòng trà, màn hình livestream lơ
  // lửng ở chỗ sân khấu. Đây là LỰA CHỌN, mặc định vẫn là chế độ rạp — xem live trước hết là để xem rõ buổi
  // diễn; video làm texture tốn GPU nên không ép mọi thiết bị. Không có tour, hoặc trình duyệt không có
  // WebGL, thì nút không hiện và trang y như cũ.
  const [immersive, setImmersive] = useState(false)
  const [videoEl, setVideoEl] = useState(null)
  const [tourScenes, setTourScenes] = useState([])
  const webglOk = useMemo(() => {
    try {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch { return false }
  }, [])

  const [viewerCount, setViewerCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [donationAlerts, setDonationAlerts] = useState([])
  // Cắt sóng (chỉ Admin): hộp thoại riêng vì `reason` bắt buộc và hành động KHÔNG hoàn tác được.
  const [moCatSong, setMoCatSong] = useState(false)
  const [lyDoCatSong, setLyDoCatSong] = useState('')
  const [dangCatSong, setDangCatSong] = useState(false)

  const heartbeatRef = useRef(null)

  // Tour 360° của phòng trà tổ chức buổi diễn này (endpoint đọc là công khai). Lỗi thì coi như không có tour.
  const loungeId = showData?.lounge?.id
  useEffect(() => {
    if (!loungeId) return
    let bo = false
    getLoungeTour(loungeId)
      .then((r) => { if (!bo && r.success) setTourScenes((r.data?.scenes ?? []).filter((sc) => sc.imageUrl)) })
      .catch(() => {})
    return () => { bo = true }
  }, [loungeId])

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

  // CẮT SÓNG — W22. Trạng thái Terminated là TRẠNG THÁI CUỐI: sau khi cắt, stream không thể phát
  // lại và buổi diễn bị đồng bộ sang Ended. Backend ghi lại ai cắt và lý do, rồi thông báo cho mọi
  // người đang xem qua SignalR để client ngừng gọi HLS. Vì vậy không có nút "bật lại".
  const handleCatSong = async () => {
    if (!lyDoCatSong.trim()) {
      toast.error('Phải ghi lý do cắt sóng — lý do được lưu lại cùng tên người cắt.')
      return
    }
    setDangCatSong(true)
    try {
      await terminateLivestream(livestream.id, lyDoCatSong.trim())
      toast.success('Đã cắt sóng buổi phát này.')
      setMoCatSong(false)
      setLyDoCatSong('')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-brand-text" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-ink">
        <AlertCircle size={40} className="text-danger mb-4" />
        <p className="text-xl mb-4">{error}</p>
        <Link to="/" className="text-brand-text underline flex items-center gap-2"><ArrowLeft size={16} /> Về trang chủ</Link>
      </div>
    )
  }

  if (livestream && !livestream.userHasAccess) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-ink px-4 text-center">
        <Lock size={40} className="text-brand-text mb-4" />
        <p className="text-xl mb-2 font-bold">Bạn cần vé xem trực tuyến để vào buổi phát này</p>
        <p className="text-ink-soft mb-6">Hãy mua vé xem trực tuyến của buổi diễn này để mở khoá.</p>
        <Link to={`/shows/${showId}`} className="text-brand-text underline flex items-center gap-2"><ArrowLeft size={16} /> Quay lại buổi diễn</Link>
      </div>
    )
  }

  return (
    <div className="h-screen bg-page text-ink flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="flex-none flex items-center gap-4 px-4 py-2.5 bg-card border-b border-line z-50">
        <Link to={`/shows/${showId}`} className="p-1.5 hover:bg-sunken rounded-full transition-colors flex-shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">{showData?.name}</h1>
          <p className="text-xs text-ink-soft flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span> LIVE
            </span>
            <span className="flex items-center gap-1"><Eye size={12} /> {formatCompactNumber(viewerCount)}</span>
            {connectionState !== 'connected' && (
              <span className="flex items-center gap-1 text-warning">
                <WifiOff size={11} /> {connectionState === 'reconnecting' ? 'Đang kết nối lại…' : 'Đang kết nối…'}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleEndStreamClick}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-danger text-xs font-bold hover:bg-red-500/20 transition-colors"
          title="Kết thúc stream (test modal đánh giá)"
        >
          <Square size={12} className="fill-red-400" /> Kết thúc
        </button>

        {/* CẮT SÓNG — chỉ Admin. Khác hẳn "Kết thúc" của người vận hành: đây là can thiệp từ ngoài
            vào buổi đang phát vì vi phạm nội dung, và là trạng thái cuối. */}
        {user?.role === 'Admin' && livestream?.id && (
          <button
            onClick={() => setMoCatSong(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 border border-red-600 text-danger text-xs font-bold hover:bg-red-600/30 transition-colors"
            title="Admin dừng buổi phát vì vi phạm nội dung"
          >
            <ShieldOff size={12} /> Cắt sóng
          </button>
        )}

      </div>

      {/* BODY: VIDEO + CHAT */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-page relative">
          {/* BA TRẠNG THÁI KẾT THÚC KHÁC NHAU, TRƯỚC ĐÂY CHỈ CÓ MỘT.
              - Bị Admin cắt sóng: `terminatedReason` nói vì sao. Không hiện thì người xem chỉ thấy
                một khung đen và không biết chuyện gì, còn thông báo tức thời thì đã trôi mất.
              - Đã kết thúc và CÓ bản ghi lại: `recordingUrl`. Không đọc trường này thì bản ghi tồn
                tại mà không ai xem được — trong khi giao diện từng HỨA CỨNG trong mã là "được xem
                lại trong vòng 48h đối với vé VIP", một quy tắc không có ở đâu trong hệ thống. Lời
                hứa bịa đó đã bị bỏ; đây là cơ chế thật thay cho nó.
              - Đã kết thúc và KHÔNG có bản ghi: nói thẳng là không có, đừng để người ta chờ. */}
          {livestream?.status === 'Terminated' ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <ShieldOff size={34} className="mx-auto text-danger mb-4" />
                <p className="text-lg font-bold text-ink">Buổi phát đã bị dừng</p>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                  {livestream.terminatedReason
                    ? `Lý do: ${livestream.terminatedReason}`
                    : 'Quản trị viên đã dừng buổi phát này. Không có lý do được ghi lại.'}
                </p>
                <p className="text-xs text-ink-mute mt-3">
                  Đây là trạng thái cuối — buổi phát không tiếp tục được nữa.
                </p>
              </div>
            </div>
          ) : livestream?.status === 'Ended' ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <Square size={30} className="mx-auto text-ink-mute mb-4" />
                <p className="text-lg font-bold text-ink">Buổi phát đã kết thúc</p>
                {livestream.recordingUrl ? (
                  <>
                    <p className="text-sm text-ink-soft mt-2">Bạn xem lại được bản ghi.</p>
                    <a
                      href={livestream.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover"
                    >
                      <Eye size={16} /> Xem lại bản ghi
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-ink-mute mt-2 leading-relaxed">
                    Buổi phát này không có bản ghi lại.
                  </p>
                )}
              </div>
            </div>
          ) : (
          <div className="absolute inset-0 bg-espresso">
            <StreamPlayer
              streamUrl={livestream?.hlsUrl}
              donationAlerts={donationAlerts}
              onAlertEnd={handleRemoveAlert}
              hidden={immersive}
              onVideoReady={setVideoEl}
            />

            {immersive && videoEl && (
              <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-cream-mute"><Loader2 className="animate-spin" size={28} /></div>}>
                {/* Bọc ngoài để định vị: gốc PanoramaViewer đã là `relative`, truyền `absolute` vào className
                    sẽ xung đột và làm khung co về chiều cao 0 (canvas vô hình). */}
                <div className="absolute inset-0 z-10">
                <PanoramaViewer
                  scenes={tourScenes}
                  autoRotate={false}
                  videoScreen={{
                    video: videoEl,
                    // Vị trí màn hình: chú thích tên "Sân khấu" mà chủ phòng trà đặt trong tour, nếu không
                    // có thì hướng 0° (giữa ảnh).
                    yaw: tourScenes[0]?.hotspots?.find((h) => /sân khấu|stage/i.test(h.label || ''))?.yaw ?? 0,
                    pitch: tourScenes[0]?.hotspots?.find((h) => /sân khấu|stage/i.test(h.label || ''))?.pitch ?? 0,
                    widthDeg: 40,
                    placeholder: livestream?.hlsUrl ? 'Đang kết nối tới buổi diễn' : 'Buổi diễn sắp bắt đầu',
                  }}
                  className="w-full h-full"
                />
                </div>
              </Suspense>
            )}

            {tourScenes.length > 0 && webglOk && (
              <button
                type="button"
                onClick={() => setImmersive((v) => !v)}
                aria-pressed={immersive}
                className="absolute left-1/2 -translate-x-1/2 top-4 z-30 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-espresso/75 backdrop-blur-sm border border-cream/20 text-cream text-xs font-semibold hover:bg-brand hover:text-on-brand hover:border-brand transition-colors"
              >
                {immersive ? <><Theater size={15} /> Xem chế độ rạp</> : <><Sofa size={15} /> Ngồi tại phòng trà</>}
              </button>
            )}
          </div>
          )}
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-espresso/85 backdrop-blur-sm" onClick={() => !dangCatSong && setMoCatSong(false)} />
          <div className="relative bg-card border border-red-500/40 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-line">
              <h2 className="text-lg font-bold text-danger flex items-center gap-2">
                <ShieldOff size={19} /> Cắt sóng buổi phát này?
              </h2>
              <button onClick={() => setMoCatSong(false)} disabled={dangCatSong}
                className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-ink-soft leading-relaxed">
                Buổi phát sẽ dừng NGAY và <strong className="text-danger">không phát lại được</strong> —
                đây là trạng thái cuối. Buổi diễn cũng bị chuyển sang đã kết thúc, và mọi người đang
                xem bị ngắt.
              </p>
              <div>
                <label className="text-xs text-ink-mute">Lý do <span className="text-danger">*</span></label>
                <textarea rows={3} value={lyDoCatSong} maxLength={500}
                  onChange={(e) => setLyDoCatSong(e.target.value)}
                  placeholder="Nội dung vi phạm cụ thể là gì"
                  className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink resize-none focus:outline-none focus:border-red-500/50" />
                <p className="text-xs text-ink-mute mt-1">Lý do được lưu lại cùng tên người cắt.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setMoCatSong(false)} disabled={dangCatSong}
                  className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50">
                  Huỷ
                </button>
                <button onClick={handleCatSong} disabled={dangCatSong || !lyDoCatSong.trim()}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  {dangCatSong && <Loader2 size={16} className="animate-spin" />} Cắt sóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
