import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, ChevronLeft, ChevronRight, Clock, Search, MapPin, Video, QrCode, X } from 'lucide-react'
import Skeleton from '../shared/Skeleton'
import dayjs from 'dayjs'
import { getMyTickets } from '../../services/ticketServices'

const ITEMS_PER_PAGE = 10 

const isOnlineTicket = (accessType) => !!accessType && accessType !== 'Physical'

// ===== BADGE: LOẠI VÉ =====
const AccessTypeBadge = ({ accessType }) => (
  isOnlineTicket(accessType)
    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30"><Video size={12} /> Vé Livestream</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30"><MapPin size={12} /> Vé tại chỗ</span>
)

// ===== BADGE: THỜI GIAN (Sắp diễn ra / Hôm nay / Đã diễn ra) =====
const TimeBadge = ({ startDate }) => {
  if (!startDate) return null
  const d = dayjs(startDate)
  if (d.isAfter(dayjs()))
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30">Sắp diễn ra</span>
  if (d.isSame(dayjs(), 'day'))
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Hôm nay</span>
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/15 text-gray-500 border border-gray-500/30">Đã diễn ra</span>
}

// ===== BADGE: THANH TOÁN =====
const PayStatusBadge = ({ status }) => {
  const isConfirmed = status === 'Confirmed'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${isConfirmed ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {isConfirmed ? 'Đã thanh toán' : (status || '—')}
    </span>
  )
}

const TicketsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('all')        // all | upcoming | ended
  const [typeFilter, setTypeFilter] = useState('all')            // all | offline | online
  const [searchQuery, setSearchQuery] = useState('')        
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  // GỌI API VÉ
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true)
      try {
        const res = await getMyTickets({ page: pagination.page, pageSize: ITEMS_PER_PAGE })
        if (res.success) {
          const mapped = res.data.items.map(t => ({
            id: t.id,
            showId: t.showId,
            title: t.showName,
            loungeName: t.loungeName,
            start_date: t.showScheduledStart,
            pricePaid: t.pricePaid,
            tierName: t.tierName,
            status: t.status,
            accessType: t.accessType // phân biệt vé Offline / Livestream
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
  }, [pagination.page])

  // LỌC KẾT HỢP: thời gian + loại vé + search (client-side trong trang hiện tại)
  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return tickets.filter(t => {
      // 1. Thời gian
      if (activeSubTab === 'upcoming' && !dayjs(t.start_date).isAfter(dayjs())) return false
      if (activeSubTab === 'ended' && !dayjs(t.start_date).isBefore(dayjs())) return false

      // 2. Loại vé
      const online = isOnlineTicket(t.accessType)
      if (typeFilter === 'offline' && online) return false
      if (typeFilter === 'online' && !online) return false

      // 3. Tìm kiếm: tên show, phòng trà, loại vé, mã vé
      if (q) {
        const haystack = `${t.title || ''} ${t.loungeName || ''} ${t.tierName || ''} ${t.id}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [tickets, activeSubTab, typeFilter, searchQuery])

  const subTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'upcoming', label: 'Sắp diễn ra' },
    { key: 'ended', label: 'Kết thúc' }
  ]
  const typeTabs = [
    { key: 'all', label: 'Mọi loại vé' },
    { key: 'offline', label: 'Tại chỗ' },
    { key: 'online', label: 'Livestream' }
  ]

  const pillCls = (active) => `px-4 py-2 rounded-full text-sm font-medium transition-all border ${
    active ? 'bg-[#C3B665] text-black border-[#C3B665]' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
  }`

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setActiveSubTab('all')
  }

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
    <div>

      {/* ===== SEARCH BAR ===== */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm vé: tên show, phòng trà, loại vé, mã vé... (trong trang hiện tại)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C3B665]/50"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {/* ===== SUB TABS (thời gian) + FILTER LOẠI VÉ ===== */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {subTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveSubTab(tab.key)} className={pillCls(activeSubTab === tab.key)}>
            {tab.label}
          </button>
        ))}

        <div className="h-6 w-px bg-gray-800 mx-1.5 hidden sm:block" />

        {typeTabs.map(tab => (
          <button key={tab.key} onClick={() => setTypeFilter(tab.key)} className={pillCls(typeFilter === tab.key)}>
            {tab.label}
          </button>
        ))}

      </div>

      {/* ===== NỘI DUNG ===== */}
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
      ) : tickets.length === 0 ? (
        /* CHƯA CÓ VÉ GÌ CẢ */
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
          <Ticket size={40} className="text-gray-700 mb-4" />
          <p className="text-gray-400 text-lg">Chưa có vé nào trong mục này</p>
          <Link to="/" className="mt-4 text-[#C3B665] font-semibold underline hover:text-[#d4c87f]">Khám phá các shows ngay!</Link>
        </div>
      ) : filteredTickets.length > 0 ? (
        <>
          <div className="flex flex-col gap-5">
            {filteredTickets.map(ev => {
              const eventDate = dayjs(ev.start_date)
              const online = isOnlineTicket(ev.accessType)
              return (
                <Link
                  key={ev.id}
                  to={`/my-shows/ticket/${ev.id}`}
                  className={`bg-gray-900 border border-gray-800 border-l-4 rounded-2xl overflow-hidden flex shadow-lg hover:border-[#C3B665]/40 transition-colors group cursor-pointer ${
                    online ? 'border-l-purple-500' : 'border-l-blue-500'
                  }`}
                >
                  {/* KHỐI NGÀY bên trái */}
                  <div className="w-1/4 sm:w-1/5 bg-black/40 p-4 flex flex-col items-center justify-center text-center border-r-2 border-dashed border-gray-700">
                    <p className="text-3xl sm:text-4xl font-bold text-[#C3B665]">{eventDate.format('DD')}</p>
                    <p className="text-sm sm:text-base font-semibold text-white uppercase mt-1">{eventDate.format('MMM')}</p>
                    <p className="text-sm font-bold text-gray-400">{eventDate.format('HH:mm')}</p>
                  </div>

                  {/* NỘI DUNG */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center gap-2.5 min-w-0">
                    {/* Hàng badges: loại vé + thời gian + thanh toán */}
                    <div className="flex flex-wrap items-center gap-2">
                      <AccessTypeBadge accessType={ev.accessType} />
                      <TimeBadge startDate={ev.start_date} />
                      <PayStatusBadge status={ev.status} />
                    </div>

                    <h3 className="text-lg sm:text-2xl font-bold text-white truncate group-hover:text-[#C3B665] transition-colors">
                      {ev.title}
                    </h3>

                    <div className="flex flex-col gap-1.5 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin size={15} className="text-[#C3B665] flex-shrink-0" />
                        <span className="truncate">{ev.loungeName || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={15} className="text-[#C3B665] flex-shrink-0" />
                        <span>{eventDate.format('HH:mm, DD/MM/YYYY')}</span>
                      </div>
                    </div>

                    {/* Footer: tier + giá + CTA phân theo loại vé */}
                    <div className="flex items-center justify-between gap-3 pt-2.5 mt-1 border-t border-gray-800/70">
                      <div className="min-w-0">
                        <p className="text-sm text-[#C3B665] font-medium truncate">{ev.tierName}</p>
                        <p className="text-sm font-bold text-white">{ev.pricePaid?.toLocaleString('vi-VN')}đ</p>
                      </div>

                      {/* KHÁC NHAU THEO LOẠI VÉ */}
                      {online ? (
                        <span className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-500/10 border border-purple-500/40 text-purple-300 text-xs font-bold group-hover:bg-purple-500/20 transition-colors">
                          <Video size={14} /> Xem Livestream
                        </span>
                      ) : (
                        <span className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C3B665]/10 border border-[#C3B665]/40 text-[#C3B665] text-xs font-bold group-hover:bg-[#C3B665]/20 transition-colors">
                          <QrCode size={14} /> Vé QR tại cửa
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          {renderPagination()}
        </>
      ) : (
        /* CÓ VÉ NHƯNG BỘ LỌC KHÔNG KHỚP */
        <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-12 text-center">
          <Search size={36} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-400 mb-1">Không có vé nào khớp với bộ lọc</p>
          <p className="text-gray-600 text-sm mb-5">Thử đổi từ khóa hoặc bỏ filter để xem tất cả vé của trang này</p>
          <button onClick={resetFilters} className="text-[#C3B665] font-semibold text-sm underline hover:text-[#d4c87f]">
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketsTab