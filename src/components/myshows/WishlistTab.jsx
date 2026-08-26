// src/components/myshows/WishlistTab.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import ShowCard from '../home/ShowCard'
import Skeleton from '../shared/Skeleton'
import { getWishlist } from '../../services/interactionServices'

const WishlistTab = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [wishlistEvents, setWishlistEvents] = useState([])

  // GỌI API WISHLIST 
  useEffect(() => {
    const fetchWishlist = async () => {
      setIsLoading(true)
      try {
        const res = await getWishlist()
        if (res.success) {
          const items = res.data.items || res.data || []
          const mapped = items.map(show => ({
            id: show.id,
            title: show.name,
            format: show.format,
            thumbnail: show.coverImageUrl,
            start_date: show.scheduledStart,
            price: show.minPrice === 0 && show.maxPrice === 0 ? 'Miễn phí' : `${show.minPrice.toLocaleString('vi-VN')}đ`
          }))
          setWishlistEvents(mapped)
        }
      } catch (err) {
        console.error('Lỗi load wishlist:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWishlist()
  }, [])

  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="w-full aspect-video rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : wishlistEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-8">
          {wishlistEvents.map(ev => <ShowCard key={ev.id} {...ev} />)}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
          <Heart size={40} className="text-gray-700 mb-4" />
          <p className="text-gray-400 text-lg">Wishlist của bạn đang trống</p>
          <Link to="/" className="mt-4 text-[#C3B665] font-semibold underline hover:text-[#d4c87f]">Tìm shows yêu thích</Link>
        </div>
      )}
    </div>
  )
}

export default WishlistTab