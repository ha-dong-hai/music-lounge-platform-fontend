// src/components/account/FollowedLoungesTab.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import Skeleton from '../shared/Skeleton'
//import { getFollowedLounges } from '../../services/interactionService'

const FollowedLoungesTab = () => {
  const [followedLounges, setFollowedLounges] = useState([])
  const [isLoadingLounges, setIsLoadingLounges] = useState(true)

  // GỌI API LẤY DANH SÁCH PHÒNG TRÀ ĐANG THEO DÕI (chuyên trách của tab này)
//   useEffect(() => {
//     const fetchFollows = async () => {
//       setIsLoadingLounges(true)
//       try {
//         const res = await getFollowedLounges({ page: 1, pageSize: 20 })
//         if (res.success) {
//           setFollowedLounges(res.data.items || [])
//         }
//       } catch (err) {
//         console.log("Chưa tải được danh sách follow")
//       } finally {
//         setIsLoadingLounges(false)
//       }
//     }
//     fetchFollows()
//   }, [])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-[#C3B665] mb-6">Followed Musical Lounge</h2>
      {isLoadingLounges ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : followedLounges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {followedLounges.map(lounge => (
            <Link key={lounge.id} to={`/lounge/${lounge.id}`} className="bg-black/30 border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center hover:border-[#C3B665]/40 transition-colors group">
              <img src={lounge.primaryImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${lounge.name}&backgroundColor=10b981`} alt={lounge.name} className="w-20 h-20 rounded-full mb-4 border-2 border-gray-700 group-hover:border-[#C3B665] transition-colors object-cover" />
              <h3 className="text-white font-bold group-hover:text-[#C3B665] transition-colors">{lounge.name}</h3>
              <p className="text-gray-500 text-xs mt-1">{lounge.district}, {lounge.city}</p>
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