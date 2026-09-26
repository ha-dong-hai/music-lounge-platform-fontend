// src/pages/lounge/LoungeDetailPage.jsx
import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import LoungeHero from '../../components/lounge/LoungeHero'
import LoungeAbout from '../../components/lounge/LoungeAbout'
import LoungeSidebar from '../../components/lounge/LoungeSidebar'
import Skeleton from '../../components/shared/Skeleton'
import ShowCarousel from '../../components/home/ShowCarousel'
import { useAuthStore } from '../../store/useAuthStore'

// Trình xem 360° kéo theo three.js (~500KB) — chỉ tải khi phòng trà THẬT SỰ có tour, không làm nặng
// bundle chính của mọi trang.
const PanoramaViewer = lazy(() => import('../../components/lounge/PanoramaViewer'))
import { getLoungeDetail, getLoungeZones, getLoungeTour } from '../../services/loungeServices'
import { getShowsByLounge } from '../../services/showServices'
import { getFollowedLounges, toggleFollowLounge } from '../../services/interactionServices'
import { formatMinPrice } from '../../utils/formatPrice'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop'

const LoungeDetailPage = () => {
  const { id } = useParams()
  const { user, token } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [lounge, setLounge] = useState(null)
  const [zones, setZones] = useState([])
  const [tourScenes, setTourScenes] = useState([])
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
          setApiError(resLounge.message || 'Lounge not found')
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
          description: beData.description || 'There is no description for this lounge yet.',
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
          } catch { console.log('Error check follow status') }
        }

        // ===== FETCH SONG SONG: KHU VỰC + BUỔI DIỄN CỦA PHÒNG TRÀ NÀY =====
        // SỬA LỖI CŨ: chỗ này từng destructure [zonesRes, showsRes] từ một Promise.all CHỈ CÓ MỘT
        // phần tử, nên showsRes luôn undefined (danh sách buổi diễn chưa bao giờ hiện) và zonesRes
        // lại nhận kết quả getShows — một object phân trang, không phải mảng — nên Array.isArray
        // trả false và khu vực cũng không hiện. Cả hai khối đều là code chết.
        // Đồng thời đổi sang /lounge-shows/by-lounge/{id}: backend lọc theo phòng trà sẵn, không
        // phải tải 50 buổi của toàn hệ thống rồi lọc ở FE (cách cũ bỏ sót buổi nằm ngoài 50 đầu).
        const [zonesRes, showsRes, tourRes] = await Promise.all([
          getLoungeZones(beData.id).catch(() => null),
          getShowsByLounge(beData.id, { page: 1, pageSize: 6 }).catch(() => null),
          // Tour lỗi hay chưa có thì trang vẫn dùng bình thường, chỉ không hiện khối 360°.
          getLoungeTour(beData.id).catch(() => null),
        ])

        if (tourRes?.success) {
          setTourScenes((tourRes.data?.scenes ?? []).filter((sc) => sc.imageUrl))
        }

        if (zonesRes?.success && Array.isArray(zonesRes.data)) {
          setZones(zonesRes.data)
        }

        if (showsRes?.success) {
          const filteredShows = (showsRes.data?.items ?? [])
            .sort((a, b) => dayjs(b.scheduledStart).valueOf() - dayjs(a.scheduledStart).valueOf())
            .map(show => ({
              id: show.id,
              title: show.name,
              thumbnail: show.coverImageUrl, // dùng trực tiếp
              start_date: show.scheduledStart,
              genre: show.genres?.[0]?.name || 'Acoustic',
              mood: 'Chill',
              price: formatMinPrice(show)
            }))
          setLoungeShows(filteredShows)
        }
      } catch (err) {
        console.error('Lounge loading error:', err)
        // Giữ err lại trong log: lỗi tải phòng trà thường là 404 hoặc phòng trà bị đình chỉ.
        setApiError('Unable to load lounge data.')
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
      toast.success(prevStatus ? `Unfollowed ${lounge.name}` : `Following ${lounge.name}`)
      // Cập nhật đồng bộ followerCount hiển thị
      setLounge(prev => ({ ...prev, followerCount: prev.followerCount + (prevStatus ? -1 : 1) }))
    } catch (err) {
      setIsFollowing(prevStatus)
      setLounge(prev => ({ ...prev, followerCount: prev.followerCount + (prevStatus ? 1 : -1) }))
      toast.error(err.response?.data?.message || 'The process failed.')
    } finally {
      setIsUpdatingFollow(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-page">
        <div className="w-full h-[500px] md:h-[600px] bg-card flex items-end">
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
      <div className="min-h-[60vh] bg-page flex flex-col items-center justify-center text-ink">
        <h1 className="text-2xl font-bold mb-4">{apiError || 'Lounge not found'}</h1>
        <Link to="/" className="text-brand-text flex items-center gap-2"><ArrowLeft size={18} /> Về trang chủ</Link>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] bg-page text-ink pb-20">
      <LoungeHero lounge={lounge} isFollowing={isFollowing} onToggleFollow={handleToggleFollow} />
      <div className="max-w-[1600px] mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            <LoungeAbout lounge={lounge} zones={zones} />

            {tourScenes.length > 0 && (
              <section aria-labelledby="tour-360-title">
                <h2 id="tour-360-title" className="font-display text-2xl font-semibold text-ink mb-1">Tham quan không gian 360°</h2>
                <p className="text-sm text-ink-mute mb-4">Nhìn quanh phòng trà trước khi chọn chỗ ngồi — kéo để xoay, cuộn để phóng to.</p>
                <Suspense fallback={<Skeleton className="w-full aspect-video rounded-2xl" />}>
                  <PanoramaViewer scenes={tourScenes} className="w-full aspect-video rounded-2xl border border-line shadow-glow" />
                </Suspense>
              </section>
            )}
          </div>
          <div className="lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
            <LoungeSidebar lounge={lounge} />
          </div>
        </div>
      </div>

      {/* BUỔI DIỄN CỦA PHÒNG TRÀ NÀY — trước đây state loungeShows được set nhưng không render ở
          đâu, nên dù fetch có chạy cũng không ai thấy. Danh sách rỗng thì không hiện cả khối. */}
      {loungeShows.length > 0 && (
        <div className="mt-16 bg-page text-brand-text rounded-2xl mx-6 md:mx-auto md:max-w-[1600px] p-6 md:p-10">
          <ShowCarousel title={`Buổi diễn tại ${lounge.name}`} events={loungeShows} showViewMore={false} />
        </div>
      )}
    </div>
  )
}

export default LoungeDetailPage