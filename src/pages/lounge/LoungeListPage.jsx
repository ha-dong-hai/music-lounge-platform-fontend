// src/pages/lounge/LoungeListPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — thiết kế lại theo docs/design/TRANG-CHU-BRIEF.md:
// - Trước đây thẻ phòng trà là một vòng tròn 96px + tên + nút, và khi phòng trà chưa có ảnh thì gọi dịch vụ
//   ngoài api.dicebear.com để sinh vòng tròn chữ cái nền xanh lục #10b981 (màu mặc định của Tailwind, lạc
//   tông) — vừa là một request mạng thừa, vừa là kiểu "avatar chữ cái" chung chung. Chọn phòng trà là chọn
//   KHÔNG GIAN, nên thẻ giờ lấy ảnh không gian làm chính; chưa có ảnh thì dùng CoverFallback của thương hiệu.
// - Thông tin đặt lên thẻ đều là dữ liệu thật của API: upcomingShowCount (phòng nào sắp có show — điều khách cần
//   để quyết định), followerCount, địa chỉ. Danh sách KHÔNG có trường không gian/atmosphere nên không bịa bộ lọc đó.
// - HTML hợp lệ: trước đây <button> nằm TRONG <a>. Giờ thẻ là <article>, liên kết trải kín thẻ bằng tên phòng
//   trà (stretched link), nút theo dõi là phần tử anh em nằm trên (z-10) — người dùng bàn phím/đọc màn hình đi
//   qua hai đích riêng biệt, đúng nghĩa.
// - Nút theo dõi luôn hiện (không chỉ khi rê chuột) và cao 44px: trên điện thoại không có "rê chuột".
// GIỮ NGUYÊN mọi hành vi cũ: tìm theo tên/quận/thành phố/địa chỉ phía client, theo dõi lạc quan có hoàn lại
// khi lỗi, bắt đăng nhập, chặn bấm đúp khi đang xử lý, skeleton, trạng thái không có kết quả.
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Users, Heart, ArrowLeft, Loader2, X, Building2, CalendarClock } from 'lucide-react'
import Skeleton from '../../components/shared/Skeleton'
import CoverFallback from '../../components/shared/CoverFallback'
import Reveal from '../../components/shared/Reveal'
import toast from 'react-hot-toast'
import { getLounges } from '../../services/loungeServices'
import { getFollowedLounges, toggleFollowLounge } from '../../services/interactionServices'
import { useAuthStore } from '../../store/useAuthStore'
import { formatCompactNumber } from '../../utils/format'

const LoungeListPage = () => {
  const { user } = useAuthStore()

  const [lounges, setLounges] = useState([])
  const [followedIds, setFollowedIds] = useState(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyFollowed, setOnlyFollowed] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [failedImages, setFailedImages] = useState(new Set())

  // 1. FETCH PHÒNG TRÀ & DANH SÁCH FOLLOW CỦA USER
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const promises = [getLounges({ page: 1, pageSize: 50 })]

        // Nếu user đã đăng nhập, lấy danh sách ID đã follow để hiển thị chính xác trạng thái
        if (user) {
          promises.push(getFollowedLounges({ page: 1, pageSize: 100 }))
        }

        const [loungesRes, followsRes] = await Promise.all(promises)

        if (loungesRes?.success) {
          setLounges(loungesRes.data.items || loungesRes.data || [])
        }

        if (followsRes?.success) {
          const ids = (followsRes.data.items || []).map(item => item.id)
          setFollowedIds(new Set(ids))
        }
      } catch (err) {
        console.error('Lỗi tải danh sách phòng trà:', err)
        toast.error('Không tải được danh sách phòng trà.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [user])

  // 2. TOGGLE FOLLOW / UNFOLLOW
  const handleToggleFollow = async (e, lounge) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error('Vui lòng đăng nhập để theo dõi phòng trà.')
      return
    }

    if (updatingId) return
    setUpdatingId(lounge.id)

    const isCurrentlyFollowing = followedIds.has(lounge.id)

    // Optimistic Update
    setFollowedIds(prev => {
      const next = new Set(prev)
      if (isCurrentlyFollowing) {
        next.delete(lounge.id)
      } else {
        next.add(lounge.id)
      }
      return next
    })

    try {
      await toggleFollowLounge(lounge.id, isCurrentlyFollowing)
      toast.success(
        isCurrentlyFollowing
          ? `Đã bỏ theo dõi ${lounge.name}`
          : `Đang theo dõi ${lounge.name}`
      )
    } catch {
      // Rollback nếu API lỗi
      setFollowedIds(prev => {
        const next = new Set(prev)
        if (isCurrentlyFollowing) {
          next.add(lounge.id)
        } else {
          next.delete(lounge.id)
        }
        return next
      })
      toast.error('Thao tác thất bại, vui lòng thử lại.')
    } finally {
      setUpdatingId(null)
    }
  }

  // 3. TÌM KIẾM THEO TÊN / ĐỊA CHỈ (CLIENT-SIDE) + LỌC "ĐANG THEO DÕI"
  const filteredLounges = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return lounges.filter(l => {
      if (onlyFollowed && !followedIds.has(l.id)) return false
      if (!q) return true
      const name = (l.name || '').toLowerCase()
      const city = (l.city || '').toLowerCase()
      const district = (l.district || '').toLowerCase()
      const address = (l.fullAddress || '').toLowerCase()
      return name.includes(q) || city.includes(q) || district.includes(q) || address.includes(q)
    })
  }, [lounges, searchQuery, onlyFollowed, followedIds])

  return (
    <div className="min-h-[60vh] bg-page text-ink pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6">

        {/* TIÊU ĐỀ */}
        <div className="flex items-start gap-3 mb-8">
          <Link
            to="/"
            aria-label="Về trang chủ"
            className="mt-1 w-11 h-11 -ml-2 inline-flex items-center justify-center text-ink-soft hover:text-ink hover:bg-sunken rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Khám phá phòng trà</h1>
            <p className="text-ink-soft mt-1.5 max-w-xl leading-relaxed">
              Mỗi phòng trà một không gian riêng. Xem ảnh, chọn nơi hợp với bạn và theo dõi để không bỏ lỡ đêm diễn mới.
            </p>
          </div>
        </div>

        {/* THANH TÌM KIẾM + BỘ LỌC */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[16rem] max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none" />
            <input
              type="search"
              placeholder="Tìm theo tên hoặc khu vực"
              aria-label="Tìm phòng trà"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-11 bg-card border border-line-strong rounded-full text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-brand-text focus:ring-2 focus:ring-brand/30 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Xoá từ khoá"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-full text-ink-mute hover:text-ink hover:bg-sunken"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {user && (
            <button
              type="button"
              aria-pressed={onlyFollowed}
              onClick={() => setOnlyFollowed(v => !v)}
              className={`h-12 px-5 inline-flex items-center gap-2 rounded-full border text-sm font-medium transition-colors ${
                onlyFollowed
                  ? 'bg-espresso text-cream border-espresso'
                  : 'bg-card text-ink-soft border-line-strong hover:border-brand hover:text-ink'
              }`}
            >
              <Heart size={15} className={onlyFollowed ? 'fill-current' : ''} /> Đang theo dõi
            </button>
          )}

          {!isLoading && (
            <p className="text-sm text-ink-mute ml-auto" aria-live="polite">
              {filteredLounges.length} phòng trà
            </p>
          )}
        </div>

        {/* DANH SÁCH PHÒNG TRÀ */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-line rounded-2xl overflow-hidden">
                <Skeleton className="w-full aspect-[4/3]" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLounges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredLounges.map((lounge, i) => {
              const isFollowing = followedIds.has(lounge.id)
              const isProcessing = updatingId === lounge.id
              const hasPhoto = lounge.primaryImageUrl && !failedImages.has(lounge.id)
              const place = [lounge.district, lounge.city].filter(Boolean).join(', ') || lounge.fullAddress

              return (
                // Hai lớp: lớp ngoài chỉ lo hiện-dần (.reveal có `transition` riêng), lớp trong lo rê chuột —
                // để hai `transition` không đè nhau.
                <Reveal key={lounge.id} as="article" delay={Math.min(i, 5) * 60}>
                <div className="group relative h-full bg-card border border-line rounded-2xl overflow-hidden hover:border-line-strong hover:shadow-glow transition-[border-color,box-shadow] duration-300">
                  {/* ẢNH KHÔNG GIAN */}
                  <div className="relative aspect-[4/3] bg-sunken overflow-hidden">
                    {hasPhoto ? (
                      <img
                        src={lounge.primaryImageUrl}
                        alt=""
                        loading="lazy"
                        onError={() => setFailedImages(prev => new Set(prev).add(lounge.id))}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <CoverFallback className="w-full h-full" />
                    )}

                    {lounge.upcomingShowCount > 0 && (
                      <span className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-espresso/85 backdrop-blur-sm text-cream text-xs font-semibold">
                        <CalendarClock size={13} className="text-brand-on-dark" />
                        {lounge.upcomingShowCount} đêm sắp diễn ra
                      </span>
                    )}
                  </div>

                  {/* THÔNG TIN */}
                  <div className="p-5">
                    <h2 className="font-display text-xl font-semibold text-ink leading-snug line-clamp-1">
                      {/* liên kết trải kín cả thẻ (::after) — nút theo dõi nằm trên nó nên vẫn bấm riêng được */}
                      <Link
                        to={`/lounge/${lounge.id}`}
                        className="after:absolute after:inset-0 after:z-0 focus-visible:outline-offset-[-2px] hover:text-brand-text transition-colors"
                      >
                        {lounge.name}
                      </Link>
                    </h2>

                    {place && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
                        <MapPin size={14} className="text-brand-text flex-shrink-0" />
                        <span className="line-clamp-1">{place}</span>
                      </p>
                    )}

                    {typeof lounge.followerCount === 'number' && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-mute">
                        <Users size={13} /> {formatCompactNumber(lounge.followerCount)} người theo dõi
                      </p>
                    )}
                  </div>

                  {/* THEO DÕI — luôn hiện, 44px, nằm trên liên kết trải kín thẻ */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFollow(e, lounge)}
                    disabled={isProcessing}
                    aria-pressed={isFollowing}
                    aria-label={isFollowing ? `Bỏ theo dõi ${lounge.name}` : `Theo dõi ${lounge.name}`}
                    className={`absolute right-3 top-3 z-10 w-11 h-11 inline-flex items-center justify-center rounded-full backdrop-blur-sm border transition-colors disabled:opacity-60 ${
                      isFollowing
                        ? 'bg-espresso/85 border-espresso text-brand-on-dark'
                        : 'bg-card/90 border-line text-ink-soft hover:text-danger hover:border-danger/40'
                    }`}
                  >
                    {isProcessing
                      ? <Loader2 size={18} className="animate-spin" />
                      : <Heart size={18} className={isFollowing ? 'fill-current' : ''} />}
                  </button>
                </div>
                </Reveal>
              )
            })}
          </div>
        ) : (
          /* KHÔNG CÓ KẾT QUẢ */
          <div className="bg-card border border-dashed border-line-strong rounded-2xl py-16 px-6 text-center">
            <Building2 size={44} strokeWidth={1.25} className="mx-auto text-ink-mute mb-3" />
            <p className="font-display text-xl text-ink mb-1">
              {onlyFollowed && !searchQuery ? 'Bạn chưa theo dõi phòng trà nào' : 'Không tìm thấy phòng trà phù hợp'}
            </p>
            <p className="text-ink-soft text-sm">
              {searchQuery
                ? <>Không có kết quả cho “{searchQuery}”. Thử một tên hoặc khu vực khác.</>
                : onlyFollowed
                  ? 'Bấm hình trái tim trên thẻ phòng trà để theo dõi.'
                  : 'Hiện chưa có phòng trà nào.'}
            </p>
            {(searchQuery || onlyFollowed) && (
              <button
                onClick={() => { setSearchQuery(''); setOnlyFollowed(false) }}
                className="mt-5 h-11 px-5 rounded-full border border-line-strong text-sm font-medium text-ink hover:bg-sunken transition-colors"
              >
                Xem tất cả phòng trà
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default LoungeListPage
