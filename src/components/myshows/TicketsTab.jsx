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
    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 border border-purple-500/30"><Video size={12} /> Vé Livestream</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-sky-700 border border-blue-500/30"><MapPin size={12} /> Vé tại chỗ</span>
)

// ===== BADGE: THỜI GIAN (Sắp diễn ra / Hôm nay / Đã diễn ra) =====
const TimeBadge = ({ startDate }) => {
  if (!startDate) return null
  const d = dayjs(startDate)
  if (d.isAfter(dayjs()))
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/15 text-success border border-green-500/30">Sắp diễn ra</span>
  if (d.isSame(dayjs(), 'day'))
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-warning border border-yellow-500/30">Hôm nay</span>
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-line-strong/15 text-ink-mute border border-line-strong/30">Đã diễn ra</span>
}

// ===== BADGE: THANH TOÁN =====
const PayStatusBadge = ({ status }) => {
  const isConfirmed = status === 'Confirmed'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${isConfirmed ? 'bg-green-500/15 text-success border-green-500/30' : 'bg-line-strong/15 text-ink-soft border-line-strong/30'}`}>
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
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ended', label: 'Ended' }
  ]
  const typeTabs = [
    { key: 'all', label: 'All' },
    { key: 'offline', label: 'Offline' },
    { key: 'online', label: 'Livestream' }
  ]

  const pillCls = (active) => `px-4 py-2 rounded-full text-sm font-medium transition-all border ${
    active ? 'bg-brand text-on-brand border-brand' : 'bg-transparent text-ink-soft border-line hover:border-line-strong hover:text-white'
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
        <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(num => (
          <button key={num} onClick={() => setPagination(prev => ({ ...prev, page: num }))} className={`w-10 h-10 rounded-md border text-sm font-medium transition-colors ${pagination.page === num ? 'bg-brand text-on-brand border-brand' : 'text-ink-soft border-line hover:border-line-strong hover:text-white'}`}>
            {num}
          </button>
        ))}
        <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
    )
  }

  return (
    <div>

      {/* ===== SEARCH BAR ===== */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input
          type="text"
          placeholder="Search Ticket... (only in current page)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-card border border-line rounded-xl text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-brand/50"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink">
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

        <div className="h-6 w-px bg-sunken mx-1.5 hidden sm:block" />

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
            <div key={i} className="bg-card border border-line rounded-2xl overflow-hidden flex">
              <div className="w-1/4 sm:w-1/5 bg-sunken/70 p-4 flex flex-col items-center justify-center border-r-2 border-dashed border-line">
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
        <div className="bg-card border border-line rounded-2xl p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
          <Ticket size={40} className="text-ink-mute mb-4" />
          <p className="text-ink-soft text-lg">There are no tickets in this section.</p>
          <Link to="/" className="mt-4 text-brand-text font-semibold underline hover:text-brand-text">Discover more shows!</Link>
        </div>
      ) : filteredTickets.length > 0 ? (
        <>
          <div className="flex flex-col gap-5">
            {filteredTickets.map(ev => {
              const eventDate = dayjs(ev.start_date)
              const online = isOnlineTicket(ev.accessType)
              return (
                <div
                  key={ev.id}
                  className={`relative bg-card border border-line border-l-4 rounded-2xl overflow-hidden flex shadow-lg hover:border-brand/40 transition-colors group ${
                    online ? 'border-l-purple-500' : 'border-l-blue-500'
                  }`}
                >
                  {/* KHỐI NGÀY bên trái */}
                  <div className="w-1/4 sm:w-1/5 bg-sunken/70 p-4 flex flex-col items-center justify-center text-center border-r-2 border-dashed border-line">
                    <p className="text-3xl sm:text-4xl font-bold text-brand-text">{eventDate.format('DD')}</p>
                    <p className="text-sm sm:text-base font-semibold text-ink uppercase mt-1">{eventDate.format('MMM')}</p>
                    <p className="text-sm font-bold text-ink-soft">{eventDate.format('HH:mm')}</p>
                  </div>

                  {/* NỘI DUNG */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center gap-2.5 min-w-0">
                    {/* Hàng badges: loại vé + thời gian + thanh toán */}
                    <div className="flex flex-wrap items-center gap-2">
                      <AccessTypeBadge accessType={ev.accessType} />
                      <TimeBadge startDate={ev.start_date} />
                      <PayStatusBadge status={ev.status} />
                    </div>

                    {/* "Stretched link": thẻ <a> này phủ toàn bộ thẻ vé bằng after:inset-0, nên bấm
                        chỗ nào cũng vào chi tiết vé — mà KHÔNG phải lồng <a> trong <a>, nhờ vậy nút
                        CTA bên dưới trỏ đi chỗ khác được. */}
                    <h3 className="text-lg sm:text-2xl font-bold text-ink truncate group-hover:text-brand-text transition-colors">
                      <Link to={`/my-shows/ticket/${ev.id}`} className="after:absolute after:inset-0 after:content-['']">
                        {ev.title}
                      </Link>
                    </h3>

                    <div className="flex flex-col gap-1.5 text-sm">
                      <div className="flex items-center gap-2 text-ink-soft">
                        <MapPin size={15} className="text-brand-text flex-shrink-0" />
                        <span className="truncate">{ev.loungeName || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-ink-soft">
                        <Clock size={15} className="text-brand-text flex-shrink-0" />
                        <span>{eventDate.format('HH:mm, DD/MM/YYYY')}</span>
                      </div>
                    </div>

                    {/* Footer: tier + giá + CTA phân theo loại vé */}
                    <div className="flex items-center justify-between gap-3 pt-2.5 mt-1 border-t border-line/70">
                      <div className="min-w-0">
                        <p className="text-sm text-brand-text font-medium truncate">{ev.tierName}</p>
                        <p className="text-sm font-bold text-ink">{ev.pricePaid?.toLocaleString('vi-VN')}đ</p>
                      </div>

                      {/* KHÁC NHAU THEO LOẠI VÉ.
                          Nút của vé trực tuyến TRƯỚC ĐÂY LÀ LỜI HỨA SAI: nó ghi "View Livestream"
                          nhưng cả thẻ chỉ dẫn tới trang mã QR. Người mua vé xem trực tuyến bấm đúng
                          nút ghi "xem" mà không bao giờ tới được chỗ xem.
                          Nay nó dẫn thẳng tới trang phát. Chưa tới giờ phát thì trang đó nói rõ là
                          buổi diễn chưa có phiên livestream, chứ không vỡ — nên dẫn thẳng an toàn
                          hơn là bắt người dùng tự mò. `z-10` để nằm trên lớp phủ của stretched link. */}
                      {online ? (
                        <Link
                          to={`/livestream/${ev.showId}`}
                          className="relative z-10 flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-500/10 border border-purple-500/40 text-purple-700 text-xs font-bold hover:bg-purple-500/25 transition-colors"
                        >
                          <Video size={14} /> Vào xem trực tuyến
                        </Link>
                      ) : (
                        <span className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand/10 border border-brand/40 text-brand-text text-xs font-bold group-hover:bg-brand-hover/20 transition-colors">
                          <QrCode size={14} /> Xem mã QR vào cửa
                        </span>
                      )}
                    </div>

                    {/* Lối sang trang buổi diễn: từ đây mới xem được sơ đồ chỗ, đánh giá sau khi
                        kết thúc, và các buổi tương tự. Chi tiết VÉ không có đường nào sang đó vì
                        TicketDetailDto không trả showId — chỉ danh sách vé mới có. */}
                    <Link
                      to={`/shows/${ev.showId}`}
                      className="relative z-10 self-start text-xs text-ink-mute hover:text-brand-text transition-colors"
                    >
                      Xem trang buổi diễn →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          {renderPagination()}
        </>
      ) : (
        /* CÓ VÉ NHƯNG BỘ LỌC KHÔNG KHỚP */
        <div className="bg-card border border-dashed border-line rounded-2xl p-12 text-center">
          <Search size={36} className="mx-auto text-ink-mute mb-4" />
          <p className="text-ink-soft mb-1">No tickets match the filters.</p>
          <p className="text-ink-mute text-sm mb-5">Try changing the keywords or filters</p>
          <button onClick={resetFilters} className="text-brand-text font-semibold text-sm underline hover:text-brand-text">
            Remove all filters
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketsTab