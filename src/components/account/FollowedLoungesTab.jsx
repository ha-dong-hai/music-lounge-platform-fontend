import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, UserMinus, Loader2, ChevronRight, Compass, Bell, BellOff } from 'lucide-react'
import Skeleton from '../shared/Skeleton'
import toast from 'react-hot-toast'
import { getFollowedLounges, toggleFollowLounge, getMutedLounges, muteLounge, unmuteLounge } from '../../services/interactionServices'

const FollowedLoungesTab = () => {
  const [followedLounges, setFollowedLounges] = useState([])
  const [isLoadingLounges, setIsLoadingLounges] = useState(true)
  const [unfollowingId, setUnfollowingId] = useState(null)
  // Tat thong bao KHAC voi bo theo doi: van theo doi de phong tra con trong danh sach,
  // nhung khong nhan thong bao moi lan ho dang buoi dien moi.
  const [mutedIds, setMutedIds] = useState([])
  const [mutingId, setMutingId] = useState(null)

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
        console.log("Error loading the following list")
      } finally {
        setIsLoadingLounges(false)
      }
    }
    fetchFollows()
  }, [])

  // UNFOLLOW — optimistic update: xóa khỏi list ngay, lỗi thì rollback
  useEffect(() => {
    const chay = async () => {
      try {
        const res = await getMutedLounges()
        if (res.success) setMutedIds((res.data ?? []).map((m) => m.loungeId ?? m.id))
      } catch {
        // Khong lam phien nguoi dung vi mot danh sach phu — im lang bo qua.
      }
    }
    chay()
  }, [])

  const handleToggleMute = async (e, lounge) => {
    e.preventDefault()
    e.stopPropagation()
    if (mutingId) return
    const dangTat = mutedIds.includes(lounge.id)
    setMutingId(lounge.id)
    try {
      if (dangTat) {
        await unmuteLounge(lounge.id)
        setMutedIds((p) => p.filter((x) => x !== lounge.id))
        toast.success('Đã bật lại thông báo.')
      } else {
        await muteLounge(lounge.id)
        setMutedIds((p) => [...p, lounge.id])
        toast.success('Đã tắt thông báo từ phòng trà này.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được trạng thái thông báo.')
    } finally {
      setMutingId(null)
    }
  }

  const handleUnfollow = async (e, lounge) => {
    e.preventDefault()      // button nằm trong <Link> → chặn navigate
    e.stopPropagation()
    if (unfollowingId) return

    setUnfollowingId(lounge.id)
    const prevLounges = followedLounges
    setFollowedLounges(current => current.filter(l => l.id !== lounge.id))

    try {
      await toggleFollowLounge(lounge.id, true) // true = đang follow → BE DELETE
      toast.success(`Unfollow ${lounge.name}`)
    } catch (err) {
      setFollowedLounges(prevLounges) // rollback
      toast.error('Process failed.')
    } finally {
      setUnfollowingId(null)
    }
  }

  return (
    <div className="bg-card border border-line rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-brand-text">Followed Lounges</h2>
          {!isLoadingLounges && (
            <span className="px-2.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand-text text-xs font-bold">
              {followedLounges.length}
            </span>
          )}
        </div>

        <Link
          to="/lounges"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text hover:text-brand-text transition-all hover:gap-2 flex-shrink-0"
        >
          <Compass size={16} />
          View more
          <ChevronRight size={16} />
        </Link>
      </div>

      {isLoadingLounges ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : followedLounges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {followedLounges.map(lounge => (
            <Link key={lounge.id} to={`/lounge/${lounge.id}`} className="bg-sunken/50 border border-line rounded-xl p-6 flex flex-col items-center text-center hover:border-brand/40 transition-colors group">
              <img src={lounge.primaryImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${lounge.name}&backgroundColor=10b981`} alt={lounge.name} className="w-20 h-20 rounded-full mb-4 border-2 border-line group-hover:border-brand transition-colors object-cover" />
              <h3 className="text-ink font-bold group-hover:text-brand-text transition-colors">{lounge.name}</h3>
              <p className="text-ink-mute text-xs mt-1">{[lounge.district, lounge.city].filter(Boolean).join(', ') || '—'}</p>

              {/* NÚT BỎ THEO DÕI */}
              <button
                onClick={(e) => handleUnfollow(e, lounge)}
                disabled={unfollowingId === lounge.id}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-red-500/10 hover:border-red-500/40 hover:text-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unfollowingId === lounge.id
                  ? <><Loader2 size={13} className="animate-spin" /> Processing...</>
                  : <><UserMinus size={13} /> Bỏ theo dõi</>}
              </button>

              {/* Tắt thông báo: vẫn theo dõi, chỉ không nhận thông báo buổi diễn mới */}
              <button
                onClick={(e) => handleToggleMute(e, lounge)}
                disabled={mutingId === lounge.id}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-line text-ink-mute text-xs font-bold hover:bg-sunken hover:text-ink-soft transition-colors disabled:opacity-50"
              >
                {mutingId === lounge.id
                  ? <><Loader2 size={13} className="animate-spin" /> Đang xử lý...</>
                  : mutedIds.includes(lounge.id)
                    ? <><BellOff size={13} /> Đang tắt thông báo</>
                    : <><Bell size={13} /> Tắt thông báo</>}
              </button>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 size={40} className="mx-auto text-ink-mute mb-4" />
          <p className="text-ink-soft">No Followed Lounge.</p>
          <Link to="/lounges" className="mt-4 inline-block text-brand-text font-semibold underline hover:text-brand-text">Discover musical lounge now!</Link>
        </div>
      )}
    </div>
  )
}

export default FollowedLoungesTab