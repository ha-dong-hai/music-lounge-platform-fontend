import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, WifiOff, Square, Lock, ShieldOff, Sofa, Theater } from 'lucide-react'
import toast from 'react-hot-toast'
import StreamPlayer from '../../components/livestream/StreamPlayer'
import ChatPanel from '../../components/livestream/ChatPanel'
import { themTin, tuLichSu } from '../../utils/chatTrucTiep'
import { getShowDetail, rateShow } from '../../services/showServices'
import { getLivestreamDetail, getChatHistory, sendHeartbeat, terminateLivestream } from '../../services/livestreamServices'
import { submitContentReport } from '../../services/contentReportServices'
import { useAuthStore } from '../../store/useAuthStore'
import { useLivestreamHub } from '../../hooks/useLivestreamHub'

import RatingModal from '../../components/livestream/RatingModal'
import HopXacNhan from '../../components/shared/HopXacNhan'
import { getLoungeTour } from '../../services/loungeServices'
import { guiUngHoQuaVnPay } from '../../utils/ungHo'
import LienKetMuiTen from '../../components/shared/LienKetMuiTen'
import BoDemNguoiXem from '../../components/livestream/BoDemNguoiXem'

// Chế độ "ngồi tại phòng trà" kéo theo three.js (~500KB) — chỉ tải khi người xem BẬT nó.
const PanoramaViewer = lazy(() => import('../../components/lounge/PanoramaViewer'))

const HEARTBEAT_INTERVAL_MS = 30000

// C8 (05/10/2026): GET /livestreams/{id} MỞ PHIÊN XEM (tính vào giới hạn 2 thiết bị / vé). Effect chạy hai lần liền
// (React StrictMode khi dev, hoặc người dùng bấm vào lại rất nhanh) thì hai lời gọi song song mở HAI phiên cho cùng một
// tab — đo được: mở trang lần đầu đã chiếm 2/2 phiên, tab thứ hai hợp lệ bị chặn oan. Gộp các lời gọi đang bay cùng
// tham số làm một.
const dangLayChiTiet = new Map()
const layChiTietMotLan = (livestreamId, phienCu) => {
  const khoa = `${livestreamId}|${phienCu ?? ''}`
  if (!dangLayChiTiet.has(khoa)) {
    dangLayChiTiet.set(khoa, getLivestreamDetail(livestreamId, phienCu).finally(() => setTimeout(() => dangLayChiTiet.delete(khoa), 0)))
  }
  return dangLayChiTiet.get(khoa)
}

// B5: SignalR gói câu của máy chủ thành "An unexpected error … HubException: <câu>" — lấy đúng phần câu đó.
const cauLoiHub = (err) => {
  const m = String(err?.message ?? '').split('HubException: ')
  return m.length > 1 ? m.at(-1).trim() : null
}

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
  // Tín hiệu từ phòng trà (MLACP-191): 'reconnecting' khi encoder mất kết nối và hệ thống đang chờ nối lại
  // (livestream_reconnect_timeout_minutes, mặc định 5 phút). Trước 01/10/2026 web không xử lý — video đứng hình mà
  // người xem không biết vì sao.
  const [tinHieu, setTinHieu] = useState(null)
  const [messages, setMessages] = useState([])
  const [donationAlerts, setDonationAlerts] = useState([])
  // Cắt sóng (chỉ Admin): hộp thoại riêng vì `reason` bắt buộc và hành động KHÔNG hoàn tác được.
  const [moCatSong, setMoCatSong] = useState(false)
  const [lyDoCatSong, setLyDoCatSong] = useState('')
  const [dangCatSong, setDangCatSong] = useState(false)
  const [loiCatSong, setLoiCatSong] = useState(null)

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

        // Giữ mã phiên xem trong sessionStorage (theo từng tab) để tải lại trang không bị tính là thiết bị mới (MLACP-513).
        const khoaPhien = `phien-xem-${showRes.data.livestreamId}`
        let phienCu = null
        try { phienCu = sessionStorage.getItem(khoaPhien) } catch { /* trình duyệt chặn bộ nhớ: coi như chưa có */ }
        const lsRes = await layChiTietMotLan(showRes.data.livestreamId, phienCu)
        try {
          if (lsRes.success && lsRes.data.viewingSessionId) sessionStorage.setItem(khoaPhien, lsRes.data.viewingSessionId)
        } catch { /* không lưu được thì lần sau mở phiên mới như cũ */ }
        if (lsRes.success) {
          setLivestream(lsRes.data)
          setViewerCount(lsRes.data.viewerCount || 0)
          if (lsRes.data.status === 'Reconnecting') setTinHieu('reconnecting')
        }

        try {
          const chatRes = await getChatHistory(showRes.data.livestreamId, { pageSize: 50 })
          // API trả MỚI → CŨ; khung chat xếp CŨ → MỚI (xem utils/chatTrucTiep — đo 03/10: bản trước in ngược).
          if (chatRes.success) setMessages(tuLichSu(chatRes.data.items, user?.id))
        } catch {
          // Lịch sử chat không tải được không nên chặn cả trang — vẫn xem được livestream/chat mới.
        }
      } catch (err) {
        // Máy chủ CÓ trả lời (4xx kèm câu tiếng Việt) thì in đúng câu đó — vd. 422 "Vé này đang được xem trên 2 thiết bị
        // — vui lòng đóng bớt…". Bản cũ gộp mọi lỗi thành "Không kết nối được máy chủ" nên người xem tưởng hệ thống hỏng
        // và không biết phải đóng bớt thiết bị (đo khi chạy Mux thật 01/10/2026). Chỉ lỗi mạng mới là "không kết nối".
        setError(err?.response?.data?.message || (err?.response
          ? 'Chưa mở được buổi phát. Vui lòng thử lại.'
          : 'Không kết nối được máy chủ. Vui lòng thử lại.'))
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
        setMessages((prev) => themTin(prev, {
          chatId: msg.messageId,
          user: { name: msg.displayName, avatarUrl: null },
          content: msg.message,
          type: 'chat',
          isMine: msg.userId === user?.id,
          sentAt: msg.sentAt ?? null,
        }))
      },
      onDonationAlert: (donation) => {
        // DonationAlertDto: { donorName, amount, message, donationId, performerName } — performerName có từ MLACP-451;
        // ghi chú cũ "không có tên nghệ sĩ" đã lỗi thời, và buổi nhiều nghệ sĩ thì người xem không biết ai được ủng hộ.
        const entry = {
          id: donation.donationId,
          user: { name: donation.donorName, avatarUrl: null },
          amount: donation.amount,
          message: donation.message,
          performerName: donation.performerName ?? null,
        }
        setMessages((prev) => themTin(prev, { ...entry, type: 'donate' }))
        setDonationAlerts((prev) => [...prev.slice(-4), entry])
      },
      onDonationMessageHidden: ({ donationId }) => {
        setMessages((prev) => prev.filter((m) => m.id !== donationId))
        setDonationAlerts((prev) => prev.filter((a) => a.id !== donationId))
      },
      onChatMessageHidden: ({ chatMessageId }) => setMessages((prev) => prev.filter((m) => m.chatId !== chatMessageId)),
      onViewerCountUpdated: ({ count }) => setViewerCount(count),
      // B5: phòng trà bật/tắt khung chat (BE MLACP-643) — ô nhập đổi ngay, không đợi người xem gõ xong mới biết.
      onChatEnabledChanged: ({ enabled } = {}) => setLivestream((p) => (p ? { ...p, chatEnabled: !!enabled } : p)),
      // Các sự kiện dưới ĐỔI TRẠNG THÁI trang (không chỉ bật toast): bản cũ chỉ báo một dòng toast rồi để trình phát
      // đứng nguyên tới khi người xem tự tải lại.
      onReconnecting: () => setTinHieu('reconnecting'),
      onReconnected: () => setTinHieu(null),
      onEnded: () => { setTinHieu(null); setLivestream((p) => (p ? { ...p, status: 'Ended' } : p)) },
      onFailed: () => { setTinHieu(null); setLivestream((p) => (p ? { ...p, status: 'Failed' } : p)) },
      onTerminated: ({ reason } = {}) => {
        setTinHieu(null)
        setLivestream((p) => (p ? { ...p, status: 'Terminated', terminatedReason: reason ?? p.terminatedReason } : p))
      },
    }
  )

  useEffect(() => {
    if (!showData) return
    if (!user) return
    // MLACP-591: chủ/nhân viên của chính phòng trà này (backend chỉ trả operatorInfo cho họ và Admin) không được đánh
    // giá buổi của phòng trà mình — đừng bật hộp đánh giá để rồi bị từ chối.
    if (showData.operatorInfo && user.role !== 'Admin') return
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
    // Ném lỗi có câu tiếng Việt để RatingModal in trong hộp (409 = đã đánh giá rồi). Bản cũ toast rồi trả về êm,
    // nên hộp vẫn hiện "Cảm ơn" như vừa ghi nhận.
    try {
      await rateShow(showId, { score: rating, comment })
    } catch (err) {
      throw new Error(err.response?.status === 409
        ? 'Bạn đã đánh giá buổi diễn này rồi.'
        : err.response?.data?.message || 'Chưa gửi được đánh giá. Hãy thử lại.', { cause: err })
    }
  }

  const handleCloseRating = () => {
    setShowRatingModal(false)
    localStorage.setItem(`rated_show_${showId}`, 'true')
  }

  // B5 (05/10/2026): ném lại câu của máy chủ cho ChatPanel in dưới ô nhập và GIỮ chữ đã gõ — bản cũ toast câu chung cho
  // mọi lỗi (gửi quá nhanh, chat đã tắt) trong khi ô nhập đã bị xoá.
  const handleSendMessage = async (text) => {
    try {
      await hubSendMessage(text)
    } catch (err) {
      throw new Error(cauLoiHub(err) || 'Không gửi được tin nhắn, thử lại.', { cause: err })
    }
  }

  // Donate đi qua VNPay thật — không thêm alert cục bộ, chờ sự kiện DonationAlert dội về cho mọi người.
  // Logic tạo khoản + chuyển VNPay dùng chung với trang buổi diễn tại chỗ (utils/ungHo.js, MLACP-638).
  // B2 (05/10/2026): VNPay mở ở tab hộp ủng hộ mở sẵn — người xem ở lại buổi phát; trang kết quả có "Quay lại buổi phát".
  const handleSendDonation = async (performerId, amount, message, tab) => {
    const kq = await guiUngHoQuaVnPay(showData?.performers, performerId, amount, message, { tab, quayVe: `/livestream/${showId}` })
    if (kq?.daMoTabMoi) toast.success('Đã mở VNPay ở tab mới. Trả tiền xong, lời ủng hộ của bạn hiện ngay trong khung chat.')
    return kq
  }
  const dangPhat = ['Live', 'Reconnecting'].includes(livestream?.status)
  // Người được ủng hộ (BE MLACP-641): buổi phát miễn phí, hoặc người có vé xem trực tuyến (có phiên xem).
  const duocUngHo = dangPhat && (livestream?.isFree || !!livestream?.viewingSessionId)

  // CẮT SÓNG — W22. Trạng thái Terminated là TRẠNG THÁI CUỐI: sau khi cắt, stream không thể phát
  // lại và buổi diễn bị đồng bộ sang Ended. Backend ghi lại ai cắt và lý do, rồi thông báo cho mọi
  // người đang xem qua SignalR để client ngừng gọi HLS. Vì vậy không có nút "bật lại".
  const handleCatSong = async () => {
    if (!lyDoCatSong.trim()) {
      setLoiCatSong('Phải ghi lý do cắt sóng — lý do được lưu lại cùng tên người cắt.')
      return
    }
    setDangCatSong(true)
    try {
      await terminateLivestream(livestream.id, lyDoCatSong.trim())
      toast.success('Đã cắt sóng buổi phát này.')
      setMoCatSong(false)
      setLyDoCatSong('')
    } catch (err) {
      setLoiCatSong(err.response?.data?.message || 'Chưa cắt được sóng. Hãy thử lại.')
    } finally {
      setDangCatSong(false)
    }
  }

  const handleReport = async (reason, description) => {
    if (!livestream?.id) throw new Error('Chưa xác định được buổi phát để báo cáo.')
    // Backend chỉ nhận 3 mức đối tượng: Show / Livestream / Rating — KHÔNG báo cáo được từng tin
    // nhắn chat riêng lẻ, nên quy về cả buổi livestream và ghi lý do người dùng chọn vào nội dung.
    // reason tối đa 500 ký tự nên phải cắt trước khi gửi, tránh bị 400 vì lỗi độ dài.
    const fullReason = `${reason}: ${description}`.slice(0, 500)
    // Lỗi (vd. 409 = đã báo cáo buổi này và báo cáo cũ còn chờ xử lý) để nguyên cho ReportModal in câu backend trong
    // hộp — không toast ở đây nữa (bản cũ báo hai lần).
    await submitContentReport({
      targetType: 'Livestream',
      targetId: livestream.id,
      reason: fullReason,
    })
  }

  const handleRemoveAlert = (id) => {
    setDonationAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-ink" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-ink">
        <AlertCircle size={40} className="text-danger mb-4" />
        {/* Trang lỗi cũng cần một h1 — trình đọc màn hình nhảy theo tiêu đề (quét 01/10/2026: 0 h1). */}
        <h1 className="text-xl mb-4 px-4 text-center">{error}</h1>
        {/* MLACP-602: lối gần nhất là quay về chính buổi diễn này (xem giờ diễn, mua vé vào cửa) — trước chỉ có "Về trang
            chủ", người vào từ trang buổi diễn bị ném ra xa hai bước. */}
        <LienKetMuiTen to={`/shows/${showId}`} lui>Về trang buổi diễn</LienKetMuiTen>
        <span className="mt-3"><LienKetMuiTen to="/">Trang chủ</LienKetMuiTen></span>
      </div>
    )
  }

  if (livestream && !livestream.userHasAccess) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-ink px-4 text-center">
        <Lock size={40} className="text-ink mb-4" />
        <h1 className="text-xl mb-2 font-bold">Bạn cần vé xem trực tuyến để vào buổi phát này</h1>
        <p className="text-ink-soft mb-6">Hãy mua vé xem trực tuyến của buổi diễn này để mở khoá.</p>
        <LienKetMuiTen to={`/shows/${showId}`} lui>Quay lại buổi diễn</LienKetMuiTen>
      </div>
    )
  }

  return (
    <div className="h-screen bg-page text-ink flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="flex-none flex items-center gap-4 px-4 py-2.5 bg-card border-b border-line z-50">
        <Link to={`/shows/${showId}`} aria-label="Quay lại trang buổi diễn" className="inline-flex items-center justify-center w-11 h-11 hover:bg-sunken transition-colors flex-shrink-0">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base truncate">{showData?.name}</h1>
          <p className="text-xs text-ink-soft flex items-center gap-2 flex-wrap">
            {/* Vàng thếp (ember) là màu DUY NHẤT của "đang diễn" trong thế giới này; không nhấp nháy. */}
            {/* C4 (05/10/2026): bản cũ in "Đang phát" + số người xem cả khi buổi đã kết thúc / bị dừng. */}
            {dangPhat ? (
              <span className="inline-flex items-center px-1.5 bg-ember text-board font-semibold">Đang phát</span>
            ) : (
              <span className="inline-flex items-center px-1.5 bg-sunken text-ink-soft font-semibold">
                {{ Scheduled: 'Sắp phát', Ended: 'Đã kết thúc', Terminated: 'Đã dừng', Failed: 'Mất tín hiệu' }[livestream?.status] ?? 'Chưa phát'}
              </span>
            )}
            {/* D2 (03/10/2026): bộ đếm ô chữ lật, lật mỗi khi SignalR báo số người xem đổi. */}
            {dangPhat && <BoDemNguoiXem so={viewerCount} />}
            {dangPhat && connectionState !== 'connected' && (
              <span className="flex items-center gap-1 text-warning">
                <WifiOff size={11} /> {connectionState === 'reconnecting' ? 'Đang kết nối lại…' : 'Đang kết nối…'}
              </span>
            )}
          </p>
        </div>

        {/* 30/09/2026: đã bỏ nút đỏ "Kết thúc" — nút thử còn sót, hiện với MỌI khán giả và chỉ mở hộp đánh giá.
            Hộp đánh giá vẫn tự mở khi buổi diễn kết thúc (effect phía trên). */}
        {/* CẮT SÓNG — chỉ Admin. Khác hẳn "Kết thúc" của người vận hành: đây là can thiệp từ ngoài
            vào buổi đang phát vì vi phạm nội dung, và là trạng thái cuối. */}
        {user?.role === 'Admin' && livestream?.id && dangPhat && (
          <button
            onClick={() => setMoCatSong(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-danger bg-card text-danger text-sm font-semibold hover:bg-danger hover:text-lamp transition-colors"
            title="Admin dừng buổi phát vì vi phạm nội dung" aria-label="Admin dừng buổi phát vì vi phạm nội dung"
          >
            <ShieldOff size={12} /> Cắt sóng
          </button>
        )}

      </div>

      {/* BODY: VIDEO + CHAT. Dưới lg xếp DỌC (video 16:9 ở trên, chat chiếm phần còn lại): bản cũ để chat cố định
          300px bên phải nên trên điện thoại 390px khung video chỉ còn ~90px. */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-none aspect-video lg:aspect-auto lg:flex-1 bg-page relative">
          {/* BA TRẠNG THÁI KẾT THÚC KHÁC NHAU, TRƯỚC ĐÂY CHỈ CÓ MỘT.
              - Bị Admin cắt sóng: `terminatedReason` nói vì sao. Không hiện thì người xem chỉ thấy
                một khung đen và không biết chuyện gì, còn thông báo tức thời thì đã trôi mất.
              - Đã kết thúc: nói thẳng là KHÔNG có xem lại. Chủ dự án chốt hệ thống không có chức năng xem lại
                (01/10/2026, M-430) — bản trước còn nút "Xem lại bản ghi" khi backend trả `recordingUrl`; đã bỏ.
                Backend vẫn còn trường đó (MLACP-121) — đề nghị BE-2 trong kb/facts/fe/livestream-2026-10-01.md.
              - Mất tín hiệu quá thời gian chờ (Failed): trạng thái cuối, nói rõ để người xem không ngồi chờ. */}
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
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                  Hệ thống không lưu bản ghi để xem lại.
                </p>
              </div>
            </div>
          ) : livestream?.status === 'Failed' ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <AlertCircle size={30} className="mx-auto text-danger mb-4" aria-hidden="true" />
                <p className="text-lg font-bold text-ink">Buổi phát mất tín hiệu</p>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                  Tín hiệu từ phòng trà bị gián đoạn quá lâu và không kết nối lại được. Buổi phát này dừng tại đây.
                </p>
              </div>
            </div>
          ) : (
          <div className="absolute inset-0 bg-ink">
            <StreamPlayer
              streamUrl={livestream?.hlsUrl}
              donationAlerts={donationAlerts}
              onAlertEnd={handleRemoveAlert}
              hidden={immersive}
              onVideoReady={setVideoEl}
            />

            {/* Mất tín hiệu tạm thời (Reconnecting): giữ trình phát để tự chạy tiếp khi nối lại, chỉ phủ một dải báo. */}
            {tinHieu === 'reconnecting' && (
              <div role="status" className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-ink/90 text-lamp px-4 py-3 text-sm">
                <WifiOff size={18} aria-hidden="true" className="flex-shrink-0" />
                Tín hiệu từ phòng trà đang gián đoạn. Hệ thống đang chờ kết nối lại — bạn không cần tải lại trang.
              </div>
            )}

            {immersive && videoEl && (
              <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-lamp-mute"><Loader2 className="animate-spin" size={28} /></div>}>
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
                    // 56° (trước là 40°): khi lùi ra nhìn quanh phòng, màn hình vẫn chiếm gần nửa bề ngang khung thay
                    // vì một phần ba (MLACP-624). Lúc mở chế độ này, khung tự phóng cho màn hình vừa khung.
                    widthDeg: 56,
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
                className="absolute left-1/2 -translate-x-1/2 top-4 z-30 inline-flex items-center gap-2 px-4 h-10 bg-ink/75 border border-lamp/20 text-lamp text-xs font-semibold hover:bg-ink hover:text-lamp hover:border-ink transition-colors"
              >
                {immersive ? <><Theater size={15} /> Xem chế độ rạp</> : <><Sofa size={15} /> Ngồi tại phòng trà</>}
              </button>
            )}
          </div>
          )}
        </div>

        <div className="flex-1 min-h-0 lg:flex-none lg:w-[400px] border-t lg:border-t-0 lg:border-l border-line flex flex-col bg-card">
          <ChatPanel
            messages={messages}
            performers={showData?.performers || []}
            onSendMessage={handleSendMessage}
            onSendDonation={handleSendDonation}
            onReport={handleReport}
            chatEnabled={livestream?.chatEnabled !== false}
            canDonate={duocUngHo}
          />
        </div>
      </div>

      {/* CẮT SÓNG dùng HopXacNhan chung (01/10/2026): <dialog> giữ focus, Esc đóng, focus đầu ở nút "Không, quay lại". */}
      <HopXacNhan mo={moCatSong} tieuDe="Cắt sóng buổi phát này?" nhanXacNhan="Cắt sóng" nhanGiu="Không, quay lại"
        dangXuLy={dangCatSong} onDong={() => { setMoCatSong(false); setLoiCatSong(null) }} onXacNhan={handleCatSong}>
        <p>
          Buổi phát sẽ dừng NGAY và <strong className="text-danger">không phát lại được</strong> — đây là trạng thái cuối.
          Buổi diễn cũng chuyển sang đã kết thúc, và mọi người đang xem bị ngắt.
        </p>
        <label htmlFor="ly-do-cat-song" className="block mt-4 font-semibold text-ink">Lý do <span className="text-danger" aria-hidden="true">*</span><span className="sr-only"> (bắt buộc)</span></label>
        <p id="ly-do-cat-song-goi-y" className="text-sm">Nội dung vi phạm cụ thể là gì. Lý do được lưu cùng tên người cắt.</p>
        <textarea id="ly-do-cat-song" rows={3} maxLength={500} value={lyDoCatSong} onChange={(e) => { setLyDoCatSong(e.target.value); setLoiCatSong(null) }}
          aria-describedby={`ly-do-cat-song-goi-y${loiCatSong ? ' ly-do-cat-song-loi' : ''}`} aria-invalid={loiCatSong ? 'true' : undefined}
          className={`mt-1 w-full px-3 py-2 bg-card border-2 text-ink resize-none focus:outline-none focus:ring-2 focus:ring-ink ${loiCatSong ? 'border-danger' : 'border-ink'}`} />
        {loiCatSong && <p id="ly-do-cat-song-loi" className="mt-1 text-sm font-semibold text-danger">{loiCatSong}</p>}
      </HopXacNhan>

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
