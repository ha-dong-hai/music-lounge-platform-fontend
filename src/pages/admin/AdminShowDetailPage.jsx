// src/pages/admin/AdminShowDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, ArrowLeft, Check, X, Loader2 } from 'lucide-react'
import { showService } from '../../services/showService'
import { adminService } from '../../services/adminService'
import EventIntro from '../../components/mshow-detail/EventIntro'
import EventMap from '../../components/mshow-detail/EventMap'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const AdminShowDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [show, setShow] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('intro')
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState('')

  useEffect(() => {
    const fetchShow = async () => {
      setIsLoading(true)
      try {
        const res = await showService.getDetail(id)
        if (res?.success && res.data) {
          setShow(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch show:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchShow()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  if (!show) {
    return <div className="text-white text-center py-20">Không tìm thấy sự kiện</div>
  }

  const handleApprove = async () => {
    try {
      await adminService.approveShow(id)
      toast.success('Đã duyệt thành công!')
      navigate('/admin/shows')
    } catch {
      toast.error('Duyệt thất bại')
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectComment.trim()) return
    try {
      await adminService.rejectShow(id, rejectComment)
      toast.success('Đã từ chối chương trình')
      setIsRejectModalOpen(false)
      setRejectComment('')
      navigate('/admin/shows')
    } catch {
      toast.error('Từ chối thất bại')
    }
  }

  // Map show data for EventIntro component
  const data = {
    ...show,
    title: show.name,
    loungeLogo: show.lounge?.primaryImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${show.lounge?.name || 'ML'}&backgroundColor=10b981`,
    dateStr: show.scheduledStart ? dayjs(show.scheduledStart).format('HH:mm - dddd, DD/MM/YYYY') : 'Đang cập nhật',
    address: show.lounge?.fullAddress || `${show.lounge?.street || ''}, ${show.lounge?.district || ''}, ${show.lounge?.city || ''}`,
    description: show.description || 'Chưa có mô tả',
    posterImage: show.coverImageUrl,
    poster: show.coverImageUrl,
    loungeName: show.loungeName || show.lounge?.name || 'Music Lounge',
    genre: show.genres?.[0]?.name || 'Đang cập nhật',
    subGenre: show.genres?.[1]?.name || '',
    moodTags: [
      ...(show.genres || []).map(g => g.name),
      ...(show.moods || []).map(m => m.name),
    ].filter(Boolean),
    replayCondition: show.playbackMode === 'Replay' ? 'Được xem lại sau sự kiện' : null,
    price: show.minPrice == null ? 'Miễn phí' : `Từ ${(show.minPrice || 0).toLocaleString('vi-VN')}đ`,
  }

  const showStatus = (show.status || '').toLowerCase()
  const isPending = showStatus === 'draft' || showStatus === 'pending' || showStatus === 'pendingapproval'

  const renderStatusTag = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'published' || s === 'approved') return <span className="px-4 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold">Đã duyệt</span>
    if (s === 'draft' || s === 'pending' || s === 'pendingapproval') return <span className="px-4 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-bold">Chờ duyệt</span>
    if (s === 'cancelled' || s === 'rejected') return <span className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">Từ chối</span>
    return <span className="px-4 py-1.5 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-full text-xs font-bold">{status}</span>
  }

  return (
    <div className="min-h-screen bg-black pb-20">

      {/* ADMIN REVIEW PANEL */}
      <div className="bg-gray-950 border-b border-gray-800 sticky top-0 z-20 shadow-lg shadow-black/50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/admin/shows" className="flex items-center gap-2 text-gray-400 hover:text-[#C3B665] text-sm transition-colors">
              <ArrowLeft size={18} /> Quay lại danh sách
            </Link>
            <div className="h-6 w-px bg-gray-800 hidden md:block"></div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Trạng thái hiện tại</p>
              {renderStatusTag(show.status)}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {isPending && (
              <div className="flex gap-3 w-full md:w-auto justify-end">
                <button onClick={() => setIsRejectModalOpen(true)}
                  className="flex-1 md:flex-none px-4 py-2 bg-gray-800 text-red-400 border border-gray-700 rounded-lg text-sm font-bold hover:bg-red-500/10 hover:border-red-500/30 transition-colors">
                  Từ chối
                </button>
                <button onClick={handleApprove}
                  className="flex-1 md:flex-none px-4 py-2 bg-[#C3B665] text-black rounded-lg text-sm font-bold hover:bg-[#d4c87f] transition-colors flex items-center gap-1.5 justify-center">
                  <Check size={16} /> Duyệt chương trình
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="relative w-full h-[500px] md:h-[600px] bg-gray-900 flex items-end md:items-center">
        {data.poster && <img src={data.poster} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/80 md:via-black/60 to-transparent"></div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
          <div className="flex flex-col items-start max-w-2xl text-white">
            <div className="flex items-center gap-2 mb-4 md:mb-6 text-[#C3B665] font-medium">
              <CalendarDays size={20} />
              <span className="text-sm md:text-base">{data.dateStr}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 text-white drop-shadow-md">{data.title}</h1>
            <div className="flex items-center gap-2 mb-6 md:mb-8 text-gray-400">
              <MapPin size={18} className="flex-shrink-0 text-[#C3B665]" />
              <span className="text-sm md:text-lg">{data.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-gray-800">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('intro')}
            className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'intro' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>
            Giới thiệu
          </button>
          <button onClick={() => setActiveTab('map')}
            className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'map' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>
            Sơ đồ
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1600px] mx-auto px-6">
        {activeTab === 'intro' && <EventIntro data={data} />}
        {activeTab === 'map' && <EventMap />}
      </div>

      {/* REJECT MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsRejectModalOpen(false)}></div>

          <div className="relative bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Từ chối chương trình</h2>
              <button onClick={() => setIsRejectModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Vui lòng nhập lý do từ chối:</p>
            <textarea
              rows="4"
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="VD: Hình ảnh không rõ nét, thiếu thông tin giá vé..."
              className="w-full p-3 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 resize-none mb-6"
            />

            <div className="flex gap-3">
              <button onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Hủy
              </button>
              <button onClick={handleRejectSubmit} disabled={!rejectComment.trim()}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Gửi từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminShowDetailPage