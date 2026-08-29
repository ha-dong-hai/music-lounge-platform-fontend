// src/pages/events/EventDetailPage.jsx
import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CalendarDays, MapPin, Heart, Share2, ArrowLeft, Check, X, Copy } from 'lucide-react'
import { showService } from '../../services/showService'
import { wishlistService } from '../../services/wishlistService'
import { useAuthStore } from '../../store/useAuthStore'
import EventCarousel from '../../components/home/EventCarousel'
import EventMap from '../../components/mshow-detail/EventMap'
import EventIntro from '../../components/mshow-detail/EventIntro'
import Skeleton from '../../components/shared/Skeleton'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// Map BE show to EventCard props (for related shows carousel)
function mapShowToEvent(show) {
  return {
    id: show.id,
    title: show.name,
    thumbnail: show.coverImageUrl,
    start_date: show.scheduledStart,
    province: show.loungeCity || show.lounge?.city || '',
    genre: show.genres?.[0]?.name || 'Khác',
    mood: show.moods?.[0]?.name || '',
    space: show.atmospheres?.[0]?.name || '',
    priceValue: show.minPrice || 0,
    price: show.minPrice == null ? 'Miễn phí' : `Từ ${(show.minPrice || 0).toLocaleString('vi-VN')}đ`,
  }
}

const EventDetailPage = () => {
  const { id } = useParams()
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState('intro')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const tabsRef = useRef(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [show, setShow] = useState(null)
  const [relatedShows, setRelatedShows] = useState([])
  const [error, setError] = useState(null)

  // Fetch show detail from real API
  useEffect(() => {
    const fetchShow = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await showService.getDetail(id)
        if (res?.success && res.data) {
          setShow(res.data)
          setIsWishlisted(res.data.isWishlisted || false)

          // Fetch related shows
          try {
            const relatedRes = await showService.getPublished({ page: 1, pageSize: 8, sortBy: 'Newest' })
            if (relatedRes?.success) {
              const items = (relatedRes.data?.items || []).filter(s => s.id !== Number(id))
              setRelatedShows(items.slice(0, 8))
            }
          } catch { /* ignore */ }
        } else {
          setError('Không tìm thấy sự kiện')
        }
      } catch (err) {
        console.error('Failed to fetch show:', err)
        setError('Không thể tải thông tin sự kiện')
      } finally {
        setIsLoading(false)
      }
    }
    fetchShow()
  }, [id])

  // Derive display data from BE show
  const data = show ? {
    ...show,
    title: show.name,
    loungeId: show.loungeId || show.lounge?.id,
    posterImage: show.coverImageUrl || "https://images.unsplash.com/photo-1540039155733-d74443653133?q=80&w=2667&auto=format&fit=crop",
    loungeLogo: show.lounge?.primaryImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${show.lounge?.name || 'ML'}&backgroundColor=10b981`,
    dateStr: show.scheduledStart
      ? dayjs(show.scheduledStart).format('HH:mm - dddd, DD/MM/YYYY')
      : 'Đang cập nhật',
    address: show.lounge?.fullAddress || `${show.lounge?.street || ''}, ${show.lounge?.district || ''}, ${show.lounge?.city || ''}`,
    description: show.description || 'Chưa có mô tả',
    moodTags: [
      ...(show.genres || []).map(g => g.name),
      ...(show.moods || []).map(m => m.name),
      ...(show.atmospheres || []).map(a => a.name),
    ].filter(Boolean),
    loungeName: show.loungeName || show.lounge?.name || 'Music Lounge',
    replayCondition: show.playbackMode === 'Replay' ? "Được xem lại sau sự kiện" : null,
    genre: show.genres?.[0]?.name || 'Đang cập nhật',
    subGenre: show.genres?.[1]?.name || '',
    price: show.minPrice == null ? 'Miễn phí' : `Từ ${(show.minPrice || 0).toLocaleString('vi-VN')}đ`,
  } : null

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào wishlist')
      return
    }
    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(id)
        setIsWishlisted(false)
        toast.success('Đã xóa khỏi wishlist')
      } else {
        await wishlistService.addToWishlist(id)
        setIsWishlisted(true)
        toast.success('Đã thêm vào wishlist')
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleBookTicket = () => {
    setActiveTab('map')
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <div className="w-full h-[500px] md:h-[600px] bg-gray-900 flex items-end md:items-center">
          <div className="w-full max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
            <div className="flex flex-col items-start max-w-2xl gap-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="w-20 h-20 rounded-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-gray-800 pb-4">
          <div className="flex gap-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4">
              <Skeleton className="h-8 w-40 mb-6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-white mb-4">{error || 'Không tìm thấy sự kiện'}</h1>
        <Link to="/" className="text-[#C3B665] hover:text-[#d4c87f] flex items-center gap-2 font-medium">
          <ArrowLeft size={18} /> Quay lại trang chủ
        </Link>
      </div>
    )
  }

  const relatedEvents = relatedShows.map(mapShowToEvent)

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* HERO */}
      <div className="relative w-full min-h-screen md:h-[600px] bg-gray-900 flex items-end md:items-center">
        {data.posterImage && (
          <img src={data.posterImage} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/60 to-transparent"></div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
          <div className="flex flex-col items-start max-w-2xl text-white">
            <div className="flex items-center gap-2 mb-6 text-[#C3B665] font-medium">
              <CalendarDays size={20} />
              <span className="text-sm md:text-base">{data.dateStr}</span>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-900 mb-4 overflow-hidden border-2 border-[#C3B665] shadow-lg">
              <img src={data.loungeLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-white drop-shadow-md">{data.title}</h1>
            <div className="flex items-center gap-2 mb-8 text-gray-400">
              <MapPin size={18} className="flex-shrink-0 text-[#C3B665]" />
              <span className="text-lg">{data.address}</span>
            </div>
            <button
              onClick={handleBookTicket}
              className="bg-[#C3B665] text-black hover:bg-[#d4c87f] px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl mb-6 w-full md:w-auto">
              Book Ticket
            </button>

            <div className="flex items-center gap-6">
              <button onClick={handleToggleWishlist}
                className={`flex items-center gap-2 transition-colors group ${isWishlisted ? "text-red-500" : "text-gray-400 hover:text-[#C3B665]"}`}>
                <Heart size={20} className={`transition-all ${isWishlisted ? 'fill-red-500' : 'group-hover:fill-[#C3B665]'}`} />
                <span className="font-medium text-sm md:text-base">
                  {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                </span>
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-[#C3B665] transition-colors">
                <Share2 size={20} />
                <span className="font-medium text-sm md:text-base">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div ref={tabsRef} className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-gray-800">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('intro')}
            className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'intro' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>
            Detail
          </button>
          <button onClick={() => setActiveTab('map')}
            className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'map' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>
            Seating area
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1600px] mx-auto px-6">
        {activeTab === 'intro' && <EventIntro data={data} />}
        {activeTab === 'map' && <EventMap />}
      </div>

      {/* RELATED */}
      {relatedEvents.length > 0 && (
        <div className="mt-20 bg-black text-[#C3B665] rounded-2xl mx-6 md:mx-auto md:max-w-[1600px] p-6 md:p-10">
          <EventCarousel title="You may like" events={relatedEvents} showViewMore={false} />
        </div>
      )}

      {/* SHARE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)}></div>
          <div className="relative bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Chia sẻ sự kiện</h2>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-3">Sao chép đường link bên dưới để gửi cho bạn bè:</p>
            <div className="flex items-center gap-2 bg-black border border-gray-800 rounded-lg p-2 pl-4">
              <span className="text-gray-300 text-sm flex-1 truncate">{window.location.href}</span>
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${isCopied ? 'bg-green-500 text-white' : 'bg-[#C3B665] text-black hover:bg-[#d4c87f]'}`}
              >
                {isCopied ? <><Check size={14} /> Đã copy</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailPage