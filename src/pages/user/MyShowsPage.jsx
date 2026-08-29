// src/pages/user/MyShowsPage.jsx
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, ArrowLeft, Heart, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import EventCard from '../../components/home/EventCard'
import Skeleton from '../../components/shared/Skeleton'
import { ticketService } from '../../services/ticketService'
import { wishlistService } from '../../services/wishlistService'
import { useAuthStore } from '../../store/useAuthStore'
import dayjs from 'dayjs'

// Map BE ticket to display format
function mapTicketToEvent(ticket) {
  return {
    id: ticket.showId || ticket.id,
    title: ticket.showName || ticket.loungeShowName || 'Chương trình',
    thumbnail: ticket.showCoverImageUrl || ticket.coverImageUrl,
    start_date: ticket.scheduledStart || ticket.showScheduledStart,
    province: ticket.loungeCity || '',
    genre: ticket.genres?.[0]?.name || '',
    price: ticket.pricePaid ? `${ticket.pricePaid.toLocaleString('vi-VN')}đ` : '',
    ticketId: ticket.id,
    ticketCode: ticket.ticketCode || ticket.id,
    status: ticket.status,
    loungeName: ticket.loungeName || '',
    address: ticket.loungeAddress || ticket.loungeFullAddress || '',
  }
}

// Map BE wishlist show to EventCard format
function mapWishlistToEvent(show) {
  return {
    id: show.id,
    title: show.name,
    thumbnail: show.coverImageUrl,
    start_date: show.scheduledStart,
    province: show.loungeCity || show.lounge?.city || '',
    genre: show.genres?.[0]?.name || 'Khác',
    priceValue: show.minPrice || 0,
    price: show.minPrice == null ? 'Miễn phí' : `Từ ${(show.minPrice || 0).toLocaleString('vi-VN')}đ`,
  }
}

const MyShowsPage = () => {
  const user = useAuthStore((state) => state.user)

  const [activeMainTab, setActiveMainTab] = useState('shows')
  const [activeSubTab, setActiveSubTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [wishlistShows, setWishlistShows] = useState([])

  // Fetch tickets from real API
  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [ticketRes, wishlistRes] = await Promise.all([
          ticketService.getMyTickets({ page: 1, pageSize: 100 }),
          wishlistService.getMyWishlist({ page: 1, pageSize: 100 }),
        ])
        setTickets(ticketRes?.success ? (ticketRes.data?.items || []) : [])
        setWishlistShows(wishlistRes?.success ? (wishlistRes.data?.items || []) : [])
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [user])

  useEffect(() => { setCurrentPage(1) }, [activeMainTab, activeSubTab])

  const ownedEvents = useMemo(() => tickets.map(mapTicketToEvent), [tickets])
  const wishlistEvents = useMemo(() => wishlistShows.map(mapWishlistToEvent), [wishlistShows])

  const today = dayjs()
  const filteredOwnedEvents = useMemo(() => {
    return ownedEvents.filter(ev => {
      if (!ev.start_date) return activeSubTab === 'all'
      const eventDate = dayjs(ev.start_date)
      if (activeSubTab === 'upcoming') return eventDate.isAfter(today, 'day')
      if (activeSubTab === 'ended') return eventDate.isBefore(today, 'day')
      return true
    })
  }, [ownedEvents, activeSubTab])

  const totalShowsPages = Math.ceil(filteredOwnedEvents.length / itemsPerPage)
  const currentShows = filteredOwnedEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const subTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'upcoming', label: 'Sắp diễn ra' },
    { key: 'ended', label: 'Kết thúc' }
  ]

  const renderPagination = (totalPages) => {
    if (totalPages <= 1) return null
    return (
      <div className="flex justify-center items-center gap-2 mt-10">
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
          <button key={num} onClick={() => setCurrentPage(num)} className={`w-10 h-10 rounded-md border text-sm font-medium transition-colors ${currentPage === num ? 'bg-[#C3B665] text-black border-[#C3B665]' : 'text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}>
            {num}
          </button>
        ))}
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
    )
  }

  const renderSkeleton = () => (
    <div className="flex flex-col gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex">
          <div className="w-1/4 sm:w-1/5 bg-black/40 p-4 flex flex-col items-center justify-center border-r-2 border-dashed border-gray-800">
            <Skeleton className="h-8 w-8 mb-2" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex-1 p-6 flex flex-col justify-center gap-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

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
            <p className="text-gray-400 mb-6">Vui lòng đăng nhập để xem danh sách vé và shows bạn đã đăng ký.</p>
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

                {isLoading ? renderSkeleton() : (
                  currentShows.length > 0 ? (
                    <>
                      <div className="flex flex-col gap-5">
                        {currentShows.map(ev => {
                          const eventDate = dayjs(ev.start_date)
                          const day = eventDate.isValid() ? eventDate.format('DD') : '--'
                          const month = eventDate.isValid() ? eventDate.format('MMM') : '--'
                          const year = eventDate.isValid() ? eventDate.format('YYYY') : ''
                          const time = eventDate.isValid() ? eventDate.format('HH:mm') : '--:--'
                          const dateStr = eventDate.isValid() ? eventDate.format('DD/MM/YYYY') : ''
                          const address = ev.address || ev.loungeName || 'Đang cập nhật'

                          return (
                            <Link key={ev.ticketId} to={`/my-shows/ticket/${ev.ticketId}`} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex shadow-lg hover:border-[#C3B665]/40 transition-colors group cursor-pointer">
                              <div className="w-1/4 sm:w-1/5 bg-black/40 p-4 flex flex-col items-center justify-center text-center border-r-2 border-dashed border-gray-700 relative">
                                <p className="text-3xl sm:text-4xl font-bold text-[#C3B665]">{day}</p>
                                <p className="text-sm sm:text-base font-semibold text-white uppercase mt-1">{month}</p>
                                <p className="text-xs text-gray-500 mt-1">{year}</p>
                              </div>
                              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                                <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 truncate group-hover:text-[#C3B665] transition-colors">{ev.title}</h3>
                                <div className="flex flex-col gap-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-400"><Ticket size={16} className="text-[#C3B665] flex-shrink-0" /><span className="font-mono">Mã vé: {ev.ticketCode}</span></div>
                                  <div className="flex items-center gap-2 text-gray-400"><Clock size={16} className="text-[#C3B665] flex-shrink-0" /><span>{time}, {dateStr}</span></div>
                                  <div className="flex items-center gap-2 text-gray-400"><MapPin size={16} className="text-[#C3B665] flex-shrink-0" /><span className="truncate">{address}</span></div>
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                      {renderPagination(totalShowsPages)}
                    </>
                  ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                      <Ticket size={40} className="text-gray-700 mb-4" />
                      <p className="text-gray-400 text-lg">Không có Shows nào trong mục này</p>
                      <Link to="/" className="mt-4 text-[#C3B665] font-semibold underline hover:text-[#d4c87f]">Khám phá các shows ngay!</Link>
                    </div>
                  )
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
                ) : (
                  wishlistEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-8">
                      {wishlistEvents.map(ev => <EventCard key={ev.id} {...ev} />)}
                    </div>
                  ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                      <Heart size={40} className="text-gray-700 mb-4" />
                      <p className="text-gray-400 text-lg">Wishlist của bạn đang trống</p>
                      <Link to="/" className="mt-4 text-[#C3B665] font-semibold underline hover:text-[#d4c87f]">Tìm shows yêu thích</Link>
                    </div>
                  )
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