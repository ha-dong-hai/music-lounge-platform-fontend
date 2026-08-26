// src/pages/user/MyShowsPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, ArrowLeft, Heart, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import ShowCard from '../../components/home/ShowCard'
import Skeleton from '../../components/shared/Skeleton'
import dayjs from 'dayjs'
import { useAuthStore } from '../../store/useAuthStore'
import { getWishlist } from '../../services/interactionServices'
import { getMyTickets } from '../../services/ticketServices' 

const MyShowsPage = () => {
  const { user } = useAuthStore()
  const [activeMainTab, setActiveMainTab] = useState('shows')
  const [activeSubTab, setActiveSubTab] = useState('all')
  
  const [isLoading, setIsLoading] = useState(true)
  const [wishlistEvents, setWishlistEvents] = useState([])
  
  // State cho Vé
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
  const itemsPerPage = 4

  // ⭐ GỌI API VÉ KHI ĐỔI TAB SANG SHOWS HOẶC ĐỔI TRANG
  useEffect(() => {
    if (activeMainTab !== 'shows') return
    
    const fetchTickets = async () => {
      setIsLoading(true)
      try {
        const res = await getMyTickets({ page: pagination.page, pageSize: itemsPerPage })
        if (res.success) {
          // Map dữ liệu vé
          const mapped = res.data.items.map(t => ({
            id: t.id,
            showId: t.showId,
            title: t.showName,
            loungeName: t.loungeName,
            start_date: t.showScheduledStart,
            pricePaid: t.pricePaid,
            tierName: t.tierName,
            status: t.status
          }))
          setTickets(mapped)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        }
      } catch (err) {
        console.error('Lỗi load tickets:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTickets()
  }, [activeMainTab, pagination.page])

  // ⭐ GỌI API WISHLIST KHI ĐỔI TAB SANG WISHLIST
  useEffect(() => {
    if (activeMainTab !== 'wishlist') return
    setIsLoading(true)
    const fetchWishlist = async () => {
      try {
        const res = await getWishlist()
        if (res.success) {
          const items = res.data.items || res.data || []
          const mapped = items.map(show => ({
            id: show.id,
            title: show.name,
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
  }, [activeMainTab])

  // ⭐ LOGIC LỌC VÉ THEO TAB (Tất cả, Sắp diễn ra, Kết thúc)
  const filteredTickets = tickets.filter(t => {
    if (activeSubTab === 'all') return true
    const eventDate = dayjs(t.start_date)
    if (activeSubTab === 'upcoming') return eventDate.isAfter(dayjs())
    if (activeSubTab === 'ended') return eventDate.isBefore(dayjs())
    return true
  })

  const subTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'upcoming', label: 'Sắp diễn ra' },
    { key: 'ended', label: 'Kết thúc' }
  ]

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null
    return (
      <div className="flex justify-center items-center gap-2 mt-10">
        <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(num => (
          <button key={num} onClick={() => setPagination(prev => ({ ...prev, page: num }))} className={`w-10 h-10 rounded-md border text-sm font-medium transition-colors ${pagination.page === num ? 'bg-[#C3B665] text-black border-[#C3B665]' : 'text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}>
            {num}
          </button>
        ))}
        <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#C3B665] transition-colors">
            <ArrowLeft size={18} /> Quay lại trang chủ
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Ticket size={28} className="text-[#C3B665]" />
          <h1 className="text-3xl font-bold text-white">Danh sách của tôi</h1>
        </div>

        {!user ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <p className="text-lg font-semibold text-white mb-2">Bạn chưa đăng nhập</p>
            <p className="text-gray-400 mb-6">Vui lòng đăng nhập để xem danh sách vé và wishlist của bạn.</p>
            <Link to="/login" className="inline-block bg-[#C3B665] text-black px-6 py-2.5 rounded-lg font-semibold hover:bg-[#d4c87f] transition-colors">Đăng nhập ngay</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 border-b border-gray-800">
              <div className="flex justify-end gap-8">
                <button onClick={() => setActiveMainTab('shows')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'shows' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Shows</button>
                <button onClick={() => setActiveMainTab('wishlist')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeMainTab === 'wishlist' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Wishlist</button>
              </div>
            </div>

            {activeMainTab === 'shows' && (
              <div>
                <div className="flex gap-3 mb-8">
                  {subTabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveSubTab(tab.key)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeSubTab === tab.key ? 'bg-[#C3B665] text-black border-[#C3B665]' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}>{tab.label}</button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="flex flex-col gap-5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex">
                        <div className="w-1/4 sm:w-1/5 bg-black/40 p-4 flex flex-col items-center justify-center border-r-2 border-dashed border-gray-800">
                          <Skeleton className="h-8 w-8 mb-2" /><Skeleton className="h-4 w-12" />
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-center gap-3">
                          <Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredTickets.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-5">
                      {filteredTickets.map(ev => {
                        const eventDate = dayjs(ev.start_date)
                        return (
                          <Link key={ev.id} to={`/my-shows/ticket/${ev.id}`} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex shadow-lg hover:border-[#C3B665]/40 transition-colors group cursor-pointer">
                            <div className="w-1/4 sm:w-1/5 bg-black/40 p-4 flex flex-col items-center justify-center text-center border-r-2 border-dashed border-gray-700 relative">
                              <p className="text-3xl sm:text-4xl font-bold text-[#C3B665]">{eventDate.format('DD')}</p>
                              <p className="text-sm sm:text-base font-semibold text-white uppercase mt-1">{eventDate.format('MMM')}</p>
                            </div>
                            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                              <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 truncate group-hover:text-[#C3B665] transition-colors">{ev.title}</h3>
                              <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-400"><Ticket size={16} className="text-[#C3B665] flex-shrink-0" /><span className="font-mono truncate">Mã vé: {ev.id}</span></div>
                                <div className="flex items-center gap-2 text-gray-400"><Clock size={16} className="text-[#C3B665] flex-shrink-0" /><span>{eventDate.format('HH:mm, DD/MM/YYYY')}</span></div>
                                <div className="flex items-center gap-2 text-gray-400"><span className="font-medium text-[#C3B665]">{ev.tierName}</span> - {ev.pricePaid.toLocaleString('vi-VN')}đ</div>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                    {renderPagination()}
                  </>
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                    <Ticket size={40} className="text-gray-700 mb-4" />
                    <p className="text-gray-400 text-lg">Chưa có vé nào trong mục này</p>
                    <Link to="/" className="mt-4 text-[#C3B665] font-semibold underline hover:text-[#d4c87f]">Khám phá các shows ngay!</Link>
                  </div>
                )}
              </div>
            )}

            {activeMainTab === 'wishlist' && (
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
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MyShowsPage