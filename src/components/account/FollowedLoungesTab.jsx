// src/components/account/FollowedLoungesTab.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, UserMinus, Loader2 } from 'lucide-react'
import Skeleton from '../shared/Skeleton'
import toast from 'react-hot-toast'
import { getFollowedLounges, toggleFollowLounge } from '../../services/interactionServices'

const FollowedLoungesTab = () => {
  const [followedLounges, setFollowedLounges] = useState([])
  const [isLoadingLounges, setIsLoadingLounges] = useState(true)
  const [unfollowingId, setUnfollowingId] = useState(null) 

  // GỌI API LẤY DANH SÁCH PHÒNG TRÀ ĐANG THEO DÕI (chuyên trách của tab này)
  useEffect(() => {
    const fetchFollows = async () => {
      setIsLoadingLounges(true)
      try {
        const res = await getFollowedLounges({ page: 1, pageSize: 100 })
        if (res.success) {
          setFollowedLounges(res.data.items || [])
        }
      } catch (err) {
        console.log("Chưa tải được danh sách follow")
      } finally {
        setIsLoadingLounges(false)
      }
    }
    fetchFollows()
  }, [])

  // UNFOLLOW — optimistic update: xóa khỏi list ngay, lỗi thì rollback
  const handleUnfollow = async (e, lounge) => {
    e.preventDefault()      // button nằm trong <Link> → chặn navigate
    e.stopPropagation()
    if (unfollowingId) return

    setUnfollowingId(lounge.id)
    const prevLounges = followedLounges
    setFollowedLounges(current => current.filter(l => l.id !== lounge.id))

    try {
      await toggleFollowLounge(lounge.id, true) // true = đang follow → BE DELETE
      toast.success(`Đã bỏ theo dõi ${lounge.name}`)
    } catch (err) {
      setFollowedLounges(prevLounges) // rollback
      toast.error('Thao tác thất bại.')
    } finally {
      setUnfollowingId(null)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#C3B665]">Followed Musical Lounge</h2>
        {!isLoadingLounges && (
          <span className="px-2.5 py-1 rounded-full bg-[#C3B665]/10 border border-[#C3B665]/25 text-[#C3B665] text-xs font-bold">
            {followedLounges.length}
          </span>
        )}
      </div>
      {isLoadingLounges ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : followedLounges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {followedLounges.map(lounge => (
            <Link key={lounge.id} to={`/lounge/${lounge.id}`} className="bg-black/30 border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center hover:border-[#C3B665]/40 transition-colors group">
              <img src={lounge.primaryImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${lounge.name}&backgroundColor=10b981`} alt={lounge.name} className="w-20 h-20 rounded-full mb-4 border-2 border-gray-700 group-hover:border-[#C3B665] transition-colors object-cover" />
              <h3 className="text-white font-bold group-hover:text-[#C3B665] transition-colors">{lounge.name}</h3>
              <p className="text-gray-500 text-xs mt-1">{[lounge.district, lounge.city].filter(Boolean).join(', ') || '—'}</p>

              {/* NÚT BỎ THEO DÕI */}
              <button
                onClick={(e) => handleUnfollow(e, lounge)}
                disabled={unfollowingId === lounge.id}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-700 text-gray-400 text-xs font-bold hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unfollowingId === lounge.id
                  ? <><Loader2 size={13} className="animate-spin" /> Đang xử lý...</>
                  : <><UserMinus size={13} /> Bỏ theo dõi</>}
              </button>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 size={40} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-400">No Followed Lounge.</p>
          <Link to="/" className="mt-4 inline-block text-[#C3B665] font-semibold underline hover:text-[#d4c87f]">Khám phá phòng trà ngay!</Link>
        </div>
      )}
    </div>
  )
}

export default FollowedLoungesTab