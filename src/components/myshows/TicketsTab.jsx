import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Skeleton from '../shared/Skeleton'
import dayjs from 'dayjs'
import { getMyTickets } from '../../services/ticketServices'

const TicketsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
  const itemsPerPage = 4

  // GỌI API VÉ
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true)
      try {
        const res = await getMyTickets({ page: pagination.page, pageSize: itemsPerPage })
        if (res.success) {
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
  }, [pagination.page])

  // LOGIC LỌC VÉ THEO SUB TAB (Tất cả, Sắp diễn ra, Kết thúc)
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
    <div>
      {/* SUB TABS FILTER */}
      <div className="flex gap-3 mb-8">
        {subTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveSubTab(tab.key)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeSubTab === tab.key ? 'bg-[#C3B665] text-black border-[#C3B665]' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}>{tab.label}</button>
        ))}
      </div>

      {/* NỘI DUNG */}
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
  )
}

export default TicketsTab