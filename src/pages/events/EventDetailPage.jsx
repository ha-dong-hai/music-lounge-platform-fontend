// src/pages/events/EventDetailPage.jsx
import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CalendarDays, MapPin, Heart, Share2, ArrowLeft, Check, X, Copy, Star } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import ShowCarousel from '../../components/home/ShowCarousel'
import ShowMap from '../../components/mshow-detail/ShowMap'
import ShowIntro from '../../components/mshow-detail/ShowIntro'
import ShowRatings from '../../components/mshow-detail/ShowRatings'
import Skeleton from '../../components/shared/Skeleton'
import RatingModal from '../../components/livestream/RatingModal'
import { getShowDetail, getSimilarShows, rateShow } from '../../services/showServices'
import { getFollowedLounges, toggleWishlist, toggleFollowLounge } from '../../services/interactionServices'

import { useAuthStore } from '../../store/useAuthStore'
import { formatMinPrice } from '../../utils/formatPrice'

const EventDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('intro')
  const tabsRef = useRef(null)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [data, setData] = useState(null)
  const [relatedEvents, setRelatedEvents] = useState([])
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true)
      setApiError(null)
      try {
        const detailRes = await getShowDetail(id)

        if (detailRes.success) {
          const beData = detailRes.data
          const mappedData = {
            ...beData,
            title: beData.name,
            posterImage: beData.coverImageUrl,
            loungeName: beData.lounge?.name,
            loungeId: beData.lounge?.id,
            address: beData.lounge?.fullAddress,
            dateStr: beData.scheduledStart ? dayjs(beData.scheduledStart).format('HH:mm - dddd, DD/MM/YYYY') : 'Đang cập nhật…',
            genre: beData.genres && beData.genres.length > 0 ? beData.genres[0].name : 'Đang cập nhật…',
            performers: beData.performers || [],
            // Ba trường quyết định lối đi của khán giả theo trạng thái show
            status: beData.status,
            isOngoing: beData.isOngoing,
            userHasTicket: beData.userHasTicket,
            userHasRated: beData.userHasRated,
            moodTags: [({ Offline: 'Tại chỗ', Online: 'Trực tuyến', Hybrid: 'Kết hợp' })[beData.format] || beData.format, beData.genres?.[0]?.name].filter(Boolean),
            description: beData.description || 'Chưa có mô tả cho sự kiện này.',
            loungeLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${beData.lounge?.name || 'ML'}&backgroundColor=10b981`
          }

          setData(mappedData)
          setIsWishlisted(beData.isWishlisted || false)

          // TRẠNG THÁI FOLLOW: true dùng luôn, null/false mới check API
          if (beData.isFollowing === true) {
            setIsFollowing(true)
          } else if (user && beData.lounge?.id) {
            try {
              const followRes = await getFollowedLounges({ page: 1, pageSize: 100 })
              if (followRes.success) {
                const followedIds = followRes.data.items.map(l => l.id)
                setIsFollowing(followedIds.includes(beData.lounge.id))
              }
            } catch { console.log('Error check follow status') }
          } else {
            setIsFollowing(false)
          }

          // SHOWS TƯƠNG TỰ — endpoint /similar (BE chọn cùng phòng trà / chung thể loại)
          try {
            const simRes = await getSimilarShows(beData.id)
            if (simRes.success) {
              const related = (simRes.data ?? []).map(ev => ({
                id: ev.id,
                title: ev.name,
                thumbnail: ev.coverImageUrl,
                start_date: ev.scheduledStart,
                loungeName: ev.loungeName,
                price: formatMinPrice(ev),
                format: ev.format
              }))
              setRelatedEvents(related)
            }
          } catch { console.log('Không tải được buổi diễn tương tự.') }
        } else {
          setApiError(detailRes.message || 'Không tìm thấy buổi diễn')
        }
      } catch (err) {
        console.error('API Detail Error:', err)
        setApiError('Không thể tải chi tiết sự kiện.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEventData()
  }, [id, user])

  const handleToggleWishlist = async () => {
    if (isUpdating) return
    const prevStatus = isWishlisted
    setIsWishlisted(!prevStatus)
    setIsUpdating(true)
    try {
      await toggleWishlist(id, prevStatus)
      toast.success(prevStatus ? 'Đã bỏ khỏi yêu thích' : 'Đã thêm vào yêu thích')
    } catch (err) {
      setIsWishlisted(prevStatus)
      toast.error(err.response?.data?.message || 'Thao tác thất bại.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleFollow = async () => {
    if (isUpdating || !data?.loungeId) return
    const prevStatus = isFollowing
    setIsFollowing(!prevStatus)
    setIsUpdating(true)
    try {
      await toggleFollowLounge(data.loungeId, prevStatus)
      toast.success(prevStatus ? `Đã bỏ theo dõi ${data.loungeName}` : `Đang theo dõi ${data.loungeName}`)
    } catch (err) {
      setIsFollowing(prevStatus)
      toast.error(err.response?.data?.message || 'Thao tác thất bại.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBookTicket = () => {
    setActiveTab('map')
    setTimeout(() => { tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 100)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page pb-20">
        <div className="w-full h-[500px] md:h-[600px] bg-card flex items-end md:items-center">
          <div className="w-full max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
            <div className="flex flex-col items-start max-w-2xl gap-4">
              <Skeleton className="h-5 w-48" /><Skeleton className="w-20 h-20 rounded-full" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-line pb-4">
          <div className="flex gap-8"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-24" /></div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 bg-card border border-line rounded-2xl p-8 space-y-4"><Skeleton className="h-8 w-40 mb-6" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
            <div className="lg:col-span-3 space-y-6">{[...Array(4)].map((_, i) => (<div key={i} className="bg-card border border-line rounded-xl p-5"><Skeleton className="h-3 w-16 mb-2" /><Skeleton className="h-4 w-24" /></div>))}</div>
            <div className="lg:col-span-2 flex flex-col items-center pt-2"><Skeleton className="w-24 h-24 rounded-full mb-4" /><Skeleton className="h-8 w-24 rounded-lg" /></div>
          </div>
        </div>
      </div>
    )
  }

  if (apiError || !data) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-ink">
        <h1 className="text-2xl font-bold text-ink mb-4">{apiError || 'Không tìm thấy buổi diễn'}</h1>
        <Link to="/" className="text-brand-text hover:text-brand-text flex items-center gap-2 font-medium"><ArrowLeft size={18} /> Về trang chủ</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page pb-20">

      {/* ===== HERO POSTER ===== */}
      <div className="relative w-full min-h-[60vh] md:h-[600px] bg-card flex items-end md:items-center">
        {data.posterImage && <img src={data.posterImage} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-espresso/95 via-espresso/80 to-espresso/30"></div>
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
          <div className="flex flex-col items-start max-w-2xl text-cream">
            <div className="flex items-center gap-2 mb-6 text-brand-on-dark font-medium">
              <CalendarDays size={20} /><span className="text-sm md:text-base">{data.dateStr}</span>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-card mb-4 overflow-hidden border-2 border-brand shadow-lg">
              <img src={data.loungeLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-cream drop-shadow-md">{data.title}</h1>
            <div className="flex items-center gap-2 mb-8 text-cream-mute">
              <MapPin size={18} className="flex-shrink-0 text-brand-on-dark" /><span className="text-lg">{data.address}</span>
            </div>

            {/* LỐI ĐI TIẾP THEO TRẠNG THÁI BUỔI DIỄN */}
            {data.isOngoing ? (
              <div className="mb-6 flex flex-wrap gap-3">
                <Link to={`/livestream/${id}`}
                  className="bg-red-500 text-white hover:bg-red-600 px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> Xem trực tiếp
                </Link>
                <button onClick={handleBookTicket}
                  className="border border-brand text-brand-on-dark hover:bg-brand-hover/10 px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors">
                  Mua vé
                </button>
              </div>
            ) : data.status === 'Ended' ? (
              <div className="mb-6">
                {data.userHasRated ? (
                  <p className="text-sm text-cream-mute flex items-center gap-2">
                    <Star size={16} className="text-brand-on-dark fill-brand-on-dark" /> Bạn đã đánh giá buổi diễn này.
                  </p>
                ) : data.userHasTicket ? (
                  <button onClick={() => setShowRating(true)}
                    className="bg-brand text-on-brand hover:bg-brand-hover px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl inline-flex items-center gap-2">
                    <Star size={18} /> Đánh giá buổi diễn
                  </button>
                ) : (
                  <p className="text-sm text-cream-mute">Buổi diễn đã kết thúc.</p>
                )}
              </div>
            ) : data.status === 'Cancelled' ? (
              <p className="mb-6 text-sm text-danger">Buổi diễn này đã bị huỷ.</p>
            ) : (
              <button onClick={handleBookTicket} className="bg-brand text-on-brand hover:bg-brand-hover px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl mb-6 w-full md:w-auto">Đặt vé</button>
            )}

            <div className="flex items-center gap-6">
              <button onClick={handleToggleWishlist} disabled={isUpdating} className={`flex items-center gap-2 transition-colors group ${isWishlisted ? 'text-danger' : 'text-cream-mute hover:text-brand-on-dark'}`}>
                <Heart size={20} className={`transition-all ${isWishlisted ? 'fill-red-500' : 'group-hover:fill-brand-on-dark'}`} />
                <span className="font-medium text-sm md:text-base">{isWishlisted ? 'Đã yêu thích' : 'Yêu thích'}</span>
              </button>
              <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 text-cream-mute hover:text-brand-on-dark transition-colors">
                <Share2 size={20} /><span className="font-medium text-sm md:text-base">Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div ref={tabsRef} className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-line">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('intro')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'intro' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}>Chi tiết</button>
          <button onClick={() => setActiveTab('map')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'map' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}>Sơ đồ chỗ ngồi</button>
          <button onClick={() => setActiveTab('ratings')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'ratings' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}>Đánh giá</button>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-[1600px] mx-auto px-6">
        {activeTab === 'intro' && <ShowIntro data={data} isFollowing={isFollowing} onToggleFollow={handleToggleFollow} />}
        {activeTab === 'map' && <ShowMap showData={data} />}
        {/* Tab đánh giá tự gọi API riêng, chỉ fetch khi user bấm vào */}
        {activeTab === 'ratings' && <ShowRatings showId={id} />}
      </div>

      {/* ===== RELATED ===== */}
      {relatedEvents.length > 0 && (
        <div className="mt-20 bg-page text-brand-text rounded-2xl mx-6 md:mx-auto md:max-w-[1600px] p-6 md:p-10">
          <ShowCarousel title="Buổi diễn tương tự" events={relatedEvents} showViewMore={false} />
        </div>
      )}

      {/* ===== MODAL ĐÁNH GIÁ — reuse RatingModal của livestream ===== */}
      {showRating && (
        <RatingModal
          showName={data.title}
          onClose={() => setShowRating(false)}
          onSubmit={async (rating, comment) => {
            try {
              await rateShow(id, { score: rating, comment })
            } catch (err) {
              // 409 = đã đánh giá rồi → coi như thành công, cập nhật trạng thái
              if (err.response?.status !== 409) throw err
              toast.error('Bạn đã đánh giá buổi diễn này rồi.')
            }
            setData((p) => ({ ...p, userHasRated: true }))
          }}
        />
      )}

      {/* ===== MODAL SHARE ===== */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)}></div>
          <div className="relative bg-card border border-line rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink">Chia sẻ sự kiện</h2>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-sunken rounded-full text-ink-soft transition-colors"><X size={20} /></button>
            </div>
            <p className="text-ink-soft text-sm mb-3">Sao chép liên kết bên dưới để gửi bạn bè:</p>
            <div className="flex items-center gap-2 bg-page border border-line rounded-lg p-2 pl-4">
              <span className="text-ink-soft text-sm flex-1 truncate">{window.location.href}</span>
              <button onClick={handleCopyLink} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${isCopied ? 'bg-green-500 text-white' : 'bg-brand text-on-brand hover:bg-brand-hover'}`}>
                {isCopied ? <><Check size={14} /> Đã sao chép</> : <><Copy size={14} /> Sao chép</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailPage