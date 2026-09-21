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
import { getFollowedLounges, toggleWishlist } from '../../services/interactionServices'
import { toggleFollowLounge } from '../../services/interactionServices' 

import { useAuthStore } from '../../store/useAuthStore'

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
            dateStr: beData.scheduledStart ? dayjs(beData.scheduledStart).format('HH:mm - dddd, DD/MM/YYYY') : 'Updating...',
            genre: beData.genres && beData.genres.length > 0 ? beData.genres[0].name : 'Updating...',
            //subGenre: 'Đang cập nhật',
            performers: beData.performers || [],
            // Giữ nguyên ba trường quyết định lối đi tiếp của khán giả. Thiếu chúng thì trang chi
            // tiết là ngõ cụt: đang diễn mà không vào xem được, diễn xong mà không đánh giá được.
            status: beData.status,
            isOngoing: beData.isOngoing,
            userHasTicket: beData.userHasTicket,
            userHasRated: beData.userHasRated,
            moodTags: [beData.format, beData.genres?.[0]?.name].filter(Boolean),
            replayCondition: "Replay available within 48 hours after the Show for VIP tickets.",
            description: beData.description || "There is no description for this Show yet..",
            loungeLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${beData.lounge?.name || 'ML'}&backgroundColor=10b981`
          }

          setData(mappedData)
          setIsWishlisted(beData.isWishlisted || false)

          // XỬ LÝ LẤY TRẠNG THÁI FOLLOW CHÍNH XÁC KHI RELOAD
          if (beData.isFollowing === true) {
            setIsFollowing(true)
          } else if (user && beData.lounge?.id) {
            // Nếu BE không trả isFollowing, và user đang login, thì gọi API check
            try {
              const followRes = await getFollowedLounges({ page: 1, pageSize: 100 })
              if (followRes.success) {
                const followedIds = followRes.data.items.map(l => l.id)
                setIsFollowing(followedIds.includes(beData.lounge.id))
              }
            } catch {
              console.log("Error check follow status")
            }
          } else {
            setIsFollowing(false)
          }

          // BUỔI DIỄN TƯƠNG TỰ — dùng endpoint /similar thay vì lấy 10 buổi đầu của danh sách chung.
          // Backend chọn buổi CÙNG PHÒNG TRÀ hoặc CHUNG ÍT NHẤT MỘT THỂ LOẠI với buổi đang xem, đã
          // loại sẵn chính buổi này và chỉ trả Published/Ongoing, tối đa 6. Không cần lọc lại ở FE.
          try {
            const simRes = await getSimilarShows(beData.id)
            if (simRes.success) {
              const related = (simRes.data ?? []).map(ev => ({
                id: ev.id,
                title: ev.name,
                thumbnail: ev.coverImageUrl,
                start_date: ev.scheduledStart,
                price: ev.minPrice === 0 && ev.maxPrice === 0 ? 'Free' : `${ev.minPrice.toLocaleString('vi-VN')}đ`,
                format: ev.format
              }))
              setRelatedEvents(related)
            }
          } catch { console.log("Unable to load similar shows.") }
        } else {
          setApiError(detailRes.message || 'Show not found')
        }
      } catch (err) {
        console.error('API Detail Error:', err)
        setApiError('Unable to load show details..')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEventData()
  }, [id, user]) 

  // HÀM TOGGLE WISHLIST (GỌI API)
  const handleToggleWishlist = async () => {
    if (isUpdating) return
    const prevStatus = isWishlisted
    setIsWishlisted(!prevStatus)
    setIsUpdating(true)
    try {
      // GỌI SERVICE
      await toggleWishlist(id, prevStatus)
      toast.success(prevStatus ? 'Removed from Wishlist!' : 'Added to Wishlist!')
    } catch (err) {
      setIsWishlisted(prevStatus)
      // Hiện lý do thật của backend (vé đã hết, buổi diễn đã đóng...) thay vì một câu chung chung.
      toast.error(err.response?.data?.message || 'The process failed.')
    } finally {
      setIsUpdating(false)
    }
  }

  // HÀM TOGGLE FOLLOW (GỌI API)
  const handleToggleFollow = async () => {
    if (isUpdating || !data?.loungeId) return
    const prevStatus = isFollowing
    setIsFollowing(!prevStatus)
    setIsUpdating(true)
    try {
      // GỌI SERVICE
      await toggleFollowLounge(data.loungeId, prevStatus)
      toast.success(prevStatus ? `Unfollow ${data.loungeName}` : `Follow ${data.loungeName}`)
    } catch (err) {
      setIsFollowing(prevStatus)
      toast.error(err.response?.data?.message || 'The process failed.')
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
      <div className="min-h-screen bg-black pb-20">
        <div className="w-full h-[500px] md:h-[600px] bg-gray-900 flex items-end md:items-center">
          <div className="w-full max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
            <div className="flex flex-col items-start max-w-2xl gap-4">
              <Skeleton className="h-5 w-48" /><Skeleton className="w-20 h-20 rounded-full" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-gray-800 pb-4">
          <div className="flex gap-8"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-24" /></div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4"><Skeleton className="h-8 w-40 mb-6" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
            <div className="lg:col-span-3 space-y-6">{[...Array(4)].map((_, i) => (<div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5"><Skeleton className="h-3 w-16 mb-2" /><Skeleton className="h-4 w-24" /></div>))}</div>
            <div className="lg:col-span-2 flex flex-col items-center pt-2"><Skeleton className="w-24 h-24 rounded-full mb-4" /><Skeleton className="h-8 w-24 rounded-lg" /></div>
          </div>
        </div>
      </div>
    )
  }

  if (apiError || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold text-white mb-4">{apiError || 'Show not found'}</h1>
        <Link to="/" className="text-[#C3B665] hover:text-[#d4c87f] flex items-center gap-2 font-medium"><ArrowLeft size={18} /> Return to homepage</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* HERO POSTER */}
      <div className="relative w-full min-h-screen md:h-[600px] bg-gray-900 flex items-end md:items-center">
        {data.posterImage && <img src={data.posterImage} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/60 to-transparent"></div>
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
          <div className="flex flex-col items-start max-w-2xl text-white">
            <div className="flex items-center gap-2 mb-6 text-[#C3B665] font-medium">
              <CalendarDays size={20} /><span className="text-sm md:text-base">{data.dateStr}</span>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-900 mb-4 overflow-hidden border-2 border-[#C3B665] shadow-lg">
              <img src={data.loungeLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-white drop-shadow-md">{data.title}</h1>
            <div className="flex items-center gap-2 mb-8 text-gray-400">
              <MapPin size={18} className="flex-shrink-0 text-[#C3B665]" /><span className="text-lg">{data.address}</span>
            </div>
            {/* LỐI ĐI TIẾP THEO TRẠNG THÁI BUỔI DIỄN.
                Trước đây trang này chỉ có nút Đặt vé, nên:
                  - buổi ĐANG DIỄN: người đã mua vé xem trực tuyến không có đường nào vào xem.
                    Đường dẫn duy nhất tới /livestream/:id trong cả dự án nằm ở màn Admin báo cáo
                    vi phạm — tức khán giả không bao giờ tới được.
                  - buổi ĐÃ KẾT THÚC: không có đường nào đánh giá. rateShow chỉ được gọi từ trang
                    xem trực tuyến, nên người đến xem TRỰC TIẾP tại phòng trà không đánh giá được. */}
            {data.isOngoing ? (
              <div className="mb-6 flex flex-wrap gap-3">
                <Link to={`/livestream/${id}`}
                  className="bg-red-500 text-white hover:bg-red-600 px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> Xem trực tiếp
                </Link>
                <button onClick={handleBookTicket}
                  className="border border-[#C3B665] text-[#C3B665] hover:bg-[#C3B665]/10 px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors">
                  Mua vé
                </button>
              </div>
            ) : data.status === 'Ended' ? (
              <div className="mb-6">
                {data.userHasRated ? (
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Star size={16} className="text-[#C3B665] fill-[#C3B665]" /> Bạn đã đánh giá buổi diễn này.
                  </p>
                ) : data.userHasTicket ? (
                  <button onClick={() => setShowRating(true)}
                    className="bg-[#C3B665] text-black hover:bg-[#d4c87f] px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl inline-flex items-center gap-2">
                    <Star size={18} /> Đánh giá buổi diễn
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">Buổi diễn đã kết thúc.</p>
                )}
              </div>
            ) : data.status === 'Cancelled' ? (
              <p className="mb-6 text-sm text-red-400">Buổi diễn này đã bị huỷ.</p>
            ) : (
              <button onClick={handleBookTicket} className="bg-[#C3B665] text-black hover:bg-[#d4c87f] px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-bold transition-colors shadow-xl mb-6 w-full md:w-auto">Book Ticket</button>
            )}
            <div className="flex items-center gap-6">
              {/* NÚT WISHLIST */}
              <button onClick={handleToggleWishlist} disabled={isUpdating} className={`flex items-center gap-2 transition-colors group ${isWishlisted ? "text-red-500" : "text-gray-400 hover:text-[#C3B665]"}`}>
                <Heart size={20} className={`transition-all ${isWishlisted ? 'fill-red-500' : 'group-hover:fill-[#C3B665]'}`} />
                <span className="font-medium text-sm md:text-base">{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
              </button>
              <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 text-gray-400 hover:text-[#C3B665] transition-colors">
                <Share2 size={20} /><span className="font-medium text-sm md:text-base">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div ref={tabsRef} className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-gray-800">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('intro')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'intro' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Detail</button>
          <button onClick={() => setActiveTab('map')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'map' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Seating area</button>
          <button onClick={() => setActiveTab('ratings')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'ratings' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Đánh giá</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1600px] mx-auto px-6">
        {/* TRUYỀN PROPS QUA EVENT INTRO */}
        {activeTab === 'intro' && <ShowIntro data={data} isFollowing={isFollowing} onToggleFollow={handleToggleFollow} />}
        {activeTab === 'map' && <ShowMap loungeId={data.loungeId} showData={data} />}
        {/* Tab đánh giá tự gọi API của nó, chỉ khi người dùng bấm vào — trang chi tiết đã đủ nặng. */}
        {activeTab === 'ratings' && <ShowRatings showId={id} />}
      </div>

      {/* RELATED EVENTS */}
      {relatedEvents.length > 0 && (
        <div className="mt-20 bg-black text-[#C3B665] rounded-2xl mx-6 md:mx-auto md:max-w-[1600px] p-6 md:p-10">
          <ShowCarousel title="Buổi diễn tương tự" events={relatedEvents} showViewMore={false} />
        </div>
      )}

      {/* ĐÁNH GIÁ — dùng lại đúng component mà trang xem trực tuyến dùng, nên hai đường đánh giá
          (xem trực tiếp và đến tận nơi) cho ra cùng một trải nghiệm.
          Backend còn chặn thêm: chỉ trong 7 ngày kể từ lúc kết thúc, và bắt buộc đã check-in thật
          (quét QR vào cửa, hoặc vé trực tuyến đã từng nhận URL phát). FE không đoán hai điều kiện
          đó — cứ để người dùng bấm rồi hiện nguyên văn lý do nếu bị từ chối. */}
      {showRating && (
        <RatingModal
          showName={data.title}
          onClose={() => setShowRating(false)}
          onSubmit={async (rating, comment) => {
            // RatingModal truyền THEO THỨ TỰ (rating, comment), không phải một object — khớp đúng
            // cách LivestreamWatchPage dùng, đừng đổi một bên.
            try {
              await rateShow(id, { score: rating, comment })
            } catch (err) {
              // 409 = đã đánh giá rồi. Không ném tiếp: modal sẽ hiện màn cảm ơn, và trạng thái
              // bên dưới cập nhật thành "đã đánh giá" — đúng với thực tế trên máy chủ.
              if (err.response?.status !== 409) throw err
              toast.error('Bạn đã đánh giá buổi diễn này rồi.')
            }
            setData((p) => ({ ...p, userHasRated: true }))
          }}
        />
      )}

      {/* MODAL SHARE */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)}></div>
          <div className="relative bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Chia sẻ sự kiện</h2>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
            </div>
            <p className="text-gray-400 text-sm mb-3">Copy the link below to send to friends:</p>
            <div className="flex items-center gap-2 bg-black border border-gray-800 rounded-lg p-2 pl-4">
              <span className="text-gray-300 text-sm flex-1 truncate">{window.location.href}</span>
              <button onClick={handleCopyLink} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${isCopied ? 'bg-green-500 text-white' : 'bg-[#C3B665] text-black hover:bg-[#d4c87f]'}`}>
                {isCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailPage