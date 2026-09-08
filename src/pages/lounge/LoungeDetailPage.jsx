// src/pages/lounge/LoungeDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import LoungeHero from '../../components/lounge/LoungeHero'
import LoungeAbout from '../../components/lounge/LoungeAbout'
import LoungeSidebar from '../../components/lounge/LoungeSidebar'
import Skeleton from '../../components/shared/Skeleton'
import { useAuthStore } from '../../store/useAuthStore'
import { getLoungeDetail } from '../../services/loungeServices'
import { getShows } from '../../services/showServices'
import { getFollowedLounges, toggleFollowLounge } from '../../services/interactionServices'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop'

const LoungeDetailPage = () => {
  const { id } = useParams()
  const { user, token } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [lounge, setLounge] = useState(null)
  const [zones, setZones] = useState([])
  const [loungeShows, setLoungeShows] = useState([])

  // STATE FOLLOW
  const [isFollowing, setIsFollowing] = useState(false)
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false)

  useEffect(() => {
    const fetchLoungeData = async () => {
      setIsLoading(true)
      setApiError(null)
      try {
        const resLounge = await getLoungeDetail(id)

        if (!resLounge.success) {
          setApiError(resLounge.message || 'Không tìm thấy phòng trà')
          return
        }

        const beData = resLounge.data

        // ===== MAPPING IMAGES: dùng trực tiếp path BE (proxy lo phần forward) =====
        const gallery = (beData.galleryImages || [])
          .slice()
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .map(g => ({ url: g.imageUrl || FALLBACK_IMAGE, caption: g.caption }))

        const images = gallery.length > 0
          ? gallery
          : beData.primaryImageUrl
            ? [{ url: beData.primaryImageUrl, caption: null }]
            : [{ url: FALLBACK_IMAGE, caption: null }]

        const mappedLounge = {
          ...beData,
          images,
          tags: [beData.atmosphereName, beData.city].filter(Boolean),
          description: beData.description || 'Chưa có mô tả cho phòng trà này.',
          areaLayoutImageUrl: beData.areaLayoutImageUrl, // dùng trực tiếp (null nếu không có)
        }
        setLounge(mappedLounge)

        // ===== FOLLOW: true/false dùng luôn, null mới check API =====
        if (typeof beData.isFollowing === 'boolean') {
          setIsFollowing(beData.isFollowing)
        } else if (user && token) {
          try {
            const followRes = await getFollowedLounges({ page: 1, pageSize: 100 })
            if (followRes.success) {
              const followedIds = followRes.data.items.map(l => l.id)
              setIsFollowing(followedIds.includes(beData.id))
            }
          } catch (e) { console.log('Lỗi check follow status') }
        }

        // ===== FETCH SONG SONG: ZONES + SHOWS =====
        const [zonesRes, showsRes] = await Promise.all([
          getShows({ page: 1, pageSize: 50, includeSoldOut: true }).catch(() => null),
        ])

        // Zones thật
        if (zonesRes?.success && Array.isArray(zonesRes.data)) {
          setZones(zonesRes.data)
        }

        // Shows của phòng trà này
        if (showsRes?.success) {
          const filteredShows = showsRes.data.items
            .filter(show => show.loungeId === beData.id || show.loungeName === beData.name)
            .sort((a, b) => dayjs(b.scheduledStart).valueOf() - dayjs(a.scheduledStart).valueOf())
            .slice(0, 6)
            .map(show => ({
              id: show.id,
              title: show.name,
              thumbnail: show.coverImageUrl, // dùng trực tiếp
              start_date: show.scheduledStart,
              genre: show.genres?.[0]?.name || 'Acoustic',
              mood: 'Chill',
              price: show.minPrice === 0 && show.maxPrice === 0 ? 'Miễn phí' : `${show.minPrice.toLocaleString('vi-VN')}đ`
            }))
          setLoungeShows(filteredShows)
        }
      } catch (err) {
        console.error('Lỗi tải lounge:', err)
        setApiError('Không thể tải thông tin phòng trà.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchLoungeData()
  }, [id, user, token])

  // HÀM TOGGLE FOLLOW (GỌI API)
  const handleToggleFollow = async () => {
    if (isUpdatingFollow || !lounge) return
    if (!user) { toast.error('Vui lòng đăng nhập để theo dõi.'); return }

    const prevStatus = isFollowing
    setIsFollowing(!prevStatus)
    setIsUpdatingFollow(true)
    try {
      await toggleFollowLounge(lounge.id, prevStatus)
      toast.success(prevStatus ? `Đã bỏ theo dõi ${lounge.name}` : `Đang theo dõi ${lounge.name}`)
      // Cập nhật đồng bộ followerCount hiển thị
      setLounge(prev => ({ ...prev, followerCount: prev.followerCount + (prevStatus ? -1 : 1) }))
    } catch (err) {
      setIsFollowing(prevStatus)
      setLounge(prev => ({ ...prev, followerCount: prev.followerCount + (prevStatus ? 1 : -1) }))
      toast.error('Thao tác thất bại.')
    } finally {
      setIsUpdatingFollow(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="w-full h-[500px] md:h-[600px] bg-gray-900 flex items-end">
          <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 pb-6 md:pb-12">
            <Skeleton className="h-12 md:h-16 w-1/2 mb-4" />
            <div className="flex gap-2"><Skeleton className="h-8 w-24 rounded-full" /><Skeleton className="h-8 w-24 rounded-full" /></div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-12"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
            <div className="lg:col-span-1 space-y-6"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
          </div>
        </div>
      </div>
    )
  }

  if (apiError || !lounge) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">{apiError || 'Không tìm thấy phòng trà'}</h1>
        <Link to="/" className="text-[#C3B665] flex items-center gap-2"><ArrowLeft size={18} /> Quay lại trang chủ</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <LoungeHero lounge={lounge} isFollowing={isFollowing} onToggleFollow={handleToggleFollow} />
      <div className="max-w-[1600px] mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            <LoungeAbout lounge={lounge} zones={zones} />
          </div>
          <div className="lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
            <LoungeSidebar lounge={lounge} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoungeDetailPage