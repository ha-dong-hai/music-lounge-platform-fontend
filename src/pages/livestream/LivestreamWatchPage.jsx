import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, WifiOff, Eye } from 'lucide-react'
import StreamPlayer from '../../components/livestream/StreamPlayer'
import ChatPanel from '../../components/livestream/ChatPanel'
import { getShowDetail } from '../../services/showService'
import { useAuthStore } from '../../store/useAuthStore'

// ===== MOCK DATA (giả lập viewer + chat + donate) =====
const MOCK_VIEWERS = [254, 271, 268, 289, 305, 298, 312, 328]

const MOCK_CHATS = [
  { user: { name: 'Minh Anh', avatarUrl: null }, content: ' Âm thanh quá tuyệt vời 😍' },
  { user: { name: 'Trần Quốc Bảo', avatarUrl: null }, content: 'Xin một bài Khôngpromissa!' },
  { user: { name: 'Lan Nguyễn', avatarUrl: null }, content: 'Ngồi góc phải view sân khấu đẹp xỉu 🎤' },
  { user: { name: 'hoanglee.99', avatarUrl: null }, content: 'Ai ở Quận 1 đo hop các bạn 🍻' },
  { user: { name: 'Thảo Vy', avatarUrl: null }, content: 'Band chơi bài gì vậy ạ?' },
  { user: { name: 'David Phạm', avatarUrl: null }, content: 'Livestream mượt ghê 👏' },
  { user: { name: 'Bảo Trân', avatarUrl: null }, content: 'Guitarist đỉnh thật sự 🎸' },
  { user: { name: 'Khánh Vy', avatarUrl: null }, content: 'Đến giờ chưa mọi người?' },
  { user: { name: 'Phúc Đạt', avatarUrl: null }, content: 'Saxophone nghe là mê luôn 😭' },
]

const MOCK_DONATIONS = [
  { user: { name: 'Thảo Vy', avatarUrl: null }, performerName: 'Lê Cường', amount: 50000, message: 'Bài này hay quá anh ơi!' },
  { user: { name: 'Minh Tuấn', avatarUrl: null }, performerName: 'Minh Tuyết', amount: 200000, message: 'Chúc show thành công rực rỡ 🎉' },
  { user: { name: 'Ẩn danh', avatarUrl: null }, performerName: 'Lê Cường', amount: 100000, message: '' },
  { user: { name: 'Hải Yến', avatarUrl: null }, performerName: 'Minh Tuyết', amount: 50000, message: 'Một bài nữa đi ạ 🙏' },
]

const LivestreamWatchPage = () => {
  const { showId } = useParams()
  const { user } = useAuthStore()

  const [showData, setShowData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // UI STATE (mock — BE sẽ thay bằng trạng thái connection thật)
  const [isChatConnected, setIsChatConnected] = useState(true)
  const [viewerCount, setViewerCount] = useState(MOCK_VIEWERS[0])

  const [messages, setMessages] = useState([])
  const [donationAlerts, setDonationAlerts] = useState([])

  // FILE MỚI ĐỌC SHOW DATA (thật) — để có tên show + performers từ BE
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true)
      try {
        const res = await getShowDetail(showId)
        if (res.success) {
          setShowData(res.data)
        } else {
          setError('Không tìm thấy chương trình.')
        }
      } catch (err) {
        setError('Lỗi kết nối máy chủ.')
      } finally {
        setIsLoading(false)
      }
    }
    initData()
  }, [showId])

  // SIMULATE: chat tự nhảy mỗi 2.5s
  useEffect(() => {
    let i = 0
    const chatTimer = setInterval(() => {
      const mock = MOCK_CHATS[i % MOCK_CHATS.length]
      setMessages(prev => [...prev, { ...mock, type: 'chat' }])
      i++
    }, 2500)
    return () => clearInterval(chatTimer)
  }, [])

  // SIMULATE: donate tự nhảy mỗi ~12s
  useEffect(() => {
    let i = 0
    const donateTimer = setInterval(() => {
      const mock = MOCK_DONATIONS[i % MOCK_DONATIONS.length]
      setMessages(prev => [...prev, { ...mock, type: 'donate' }])
      setDonationAlerts(prev => [...prev.slice(-4), { ...mock, id: Date.now() }])
      i++
    }, 12000)
    return () => clearInterval(donateTimer)
  }, [])

  // SIMULATE: viewer count dao động
  useEffect(() => {
    let i = 1
    const viewerTimer = setInterval(() => {
      setViewerCount(MOCK_VIEWERS[i % MOCK_VIEWERS.length])
      i++
    }, 4000)
    return () => clearInterval(viewerTimer)
  }, [])

  // GỬI CHAT (mock): tin của mình hiện ngay kèm tag "You"
  const handleSendMessage = async (text) => {
    setMessages(prev => [...prev, {
      user: { name: user?.name || 'Bạn', avatarUrl: user?.avatarUrl },
      content: text,
      isMine: true,
      type: 'chat',
    }])
  }

  // DONATE (mock): tự thêm alert + message vào chat sau 1s "xử lý"
  const handleSendDonation = async (performerId, amount, message) => {
    await new Promise(r => setTimeout(r, 1000)) // giả lập latency BE
    const performerName = showData?.performers?.find(p => p.id === performerId)?.name || 'Nghệ sĩ'
    const donation = {
      user: { name: user?.name || 'Bạn', avatarUrl: user?.avatarUrl },
      performerName,
      amount,
      message,
    }
    setMessages(prev => [...prev, { ...donation, type: 'donate', isMine: true }])
    setDonationAlerts(prev => [...prev.slice(-4), { ...donation, id: Date.now() }])
  }

  const handleReport = async (reason, description) => {
  // TẠM GIẢ LẬP — khi BE có API report chat thì thay bằng axiosClient.post(...)
  console.log('REPORT SUBMITTED:', { showId, reason, description })
  await new Promise(r => setTimeout(r, 800)) // giả lập latency
  // throw new Error('test') // bỏ comment dòng này để test UI lỗi
}

  const handleRemoveAlert = (id) => {
    setDonationAlerts(prev => prev.filter(a => a.id !== id))
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
        <Link to="/" className="text-[#C3B665] underline flex items-center gap-2"><ArrowLeft size={16} /> Quay lại</Link>
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
            <span className="flex items-center gap-1"><Eye size={12} /> {viewerCount.toLocaleString('vi-VN')}</span>
            {!isChatConnected && (
              <span className="flex items-center gap-1 text-yellow-500"><WifiOff size={11} /> Đang kết nối lại...</span>
            )}
          </p>
        </div>
      </div>

      {/* BODY: VIDEO + CHAT */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-black relative">
          <StreamPlayer
            streamUrl={showData?.streamUrl}
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
    </div>
  )
}

export default LivestreamWatchPage