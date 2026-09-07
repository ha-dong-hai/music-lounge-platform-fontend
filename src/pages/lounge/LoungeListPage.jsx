import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Users, UserPlus, Check, ArrowLeft, Loader2, X, Building2 } from 'lucide-react'
import Skeleton from '../../components/shared/Skeleton'
import toast from 'react-hot-toast'
import { getLounges } from '../../services/loungeServices'
import { getFollowedLounges, toggleFollowLounge } from '../../services/interactionServices'
import { useAuthStore } from '../../store/useAuthStore'

const LoungeListPage = () => {
  const { user } = useAuthStore()

  const [lounges, setLounges] = useState([])
  const [followedIds, setFollowedIds] = useState(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

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
        toast.error('Không thể tải danh sách phòng trà')
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
      toast.error('Vui lòng đăng nhập để theo dõi phòng trà')
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
    } catch (err) {
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

  // 3. TÌM KIẾM THEO TÊN / ĐỊA CHỈ (CLIENT-SIDE)
  const filteredLounges = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return lounges
    return lounges.filter(l => {
      const name = (l.name || '').toLowerCase()
      const city = (l.city || '').toLowerCase()
      const district = (l.district || '').toLowerCase()
      const address = (l.fullAddress || '').toLowerCase()
      return name.includes(q) || city.includes(q) || district.includes(q) || address.includes(q)
    })
  }, [lounges, searchQuery])

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6">

        {/* HEADER & QUAY LẠI */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/" 
            className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Khám phá Phòng trà</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Khám phá không gian âm nhạc yêu thích và theo dõi để cập nhật các show mới nhất
            </p>
          </div>
        </div>

        {/* Ô TÌM KIẾM */}
        <div className="relative max-w-xl mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm theo tên phòng trà, quận huyện, thành phố..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C3B665]/60 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* DANH SÁCH PHÒNG TRÀ */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
                <Skeleton className="w-24 h-24 rounded-full mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-6" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredLounges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredLounges.map(lounge => {
              const isFollowing = followedIds.has(lounge.id)
              const isProcessing = updatingId === lounge.id

              return (
                <Link
                  key={lounge.id}
                  to={`/lounge/${lounge.id}`}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center hover:border-[#C3B665]/50 transition-all hover:-translate-y-1 group"
                >
                  {/* AVATAR PHÒNG TRÀ */}
                  <img
                    src={
                      lounge.primaryImageUrl || 
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(lounge.name || 'L')}&backgroundColor=10b981`
                    }
                    alt={lounge.name}
                    className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-gray-700 group-hover:border-[#C3B665] transition-colors"
                  />

                  {/* TÊN PHÒNG TRÀ */}
                  <h3 className="text-lg font-bold text-white group-hover:text-[#C3B665] transition-colors line-clamp-1 mb-1">
                    {lounge.name}
                  </h3>

                  {/* ĐỊA CHỈ */}
                  <p className="text-gray-400 text-xs flex items-center justify-center gap-1 mb-3 line-clamp-1">
                    <MapPin size={13} className="text-[#C3B665] flex-shrink-0" />
                    <span>{[lounge.district, lounge.city].filter(Boolean).join(', ') || lounge.fullAddress || 'Đang cập nhật'}</span>
                  </p>

                  {/* NGƯỜI THEO DÕI NẾU CÓ */}
                  {typeof lounge.followerCount === 'number' && (
                    <span className="text-[11px] text-gray-500 flex items-center gap-1 mb-5">
                      <Users size={12} /> {lounge.followerCount.toLocaleString('vi-VN')} người theo dõi
                    </span>
                  )}

                  {/* NÚT THEO DÕI / ĐANG THEO DÕI */}
                  <button
                    onClick={(e) => handleToggleFollow(e, lounge)}
                    disabled={isProcessing}
                    className={`mt-auto w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isFollowing
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30'
                        : 'bg-[#C3B665] text-black hover:bg-[#d4c87f]'
                    }`}
                  >
                    {isProcessing ? (
                      <><Loader2 size={13} className="animate-spin" /> Đang lưu...</>
                    ) : isFollowing ? (
                      <><Check size={14} strokeWidth={3} /> Đang theo dõi</>
                    ) : (
                      <><UserPlus size={14} /> Theo dõi</>
                    )}
                  </button>
                </Link>
              )
            })}
          </div>
        ) : (
          /* KHÔNG TÌM THẤY KẾT QUẢ */
          <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl py-16 text-center">
            <Building2 size={44} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-300 font-semibold mb-1">Không tìm thấy phòng trà nào</p>
            <p className="text-gray-500 text-sm">
              Không có kết quả khớp với từ khóa "{searchQuery}". Thử nhập tên khác hoặc kiểm tra lại chính tả.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default LoungeListPage