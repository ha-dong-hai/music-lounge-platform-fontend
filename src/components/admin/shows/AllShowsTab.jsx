import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight, Building, Radio, Cast, Music2, Search } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getShows } from '../../../services/showServices'

// Badge loại hình
const FormatBadge = ({ format }) => {
  const styles = {
    offline: 'bg-line-strong/10 text-ink-soft border-line-strong/20',
    livestream: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    hybrid: 'bg-blue-500/10 text-sky-700 border-blue-500/20',
  }
  const icons = { offline: <Building size={12} />, livestream: <Radio size={12} />, hybrid: <Cast size={12} /> }
  const labels = { offline: 'Offline', livestream: 'Livestream', hybrid: 'Hybrid' }
  const key = format ? format.toLowerCase() : 'offline'
  if (!labels[key]) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${styles[key]}`}>
      {icons[key]}{labels[key]}
    </span>
  )
}

// Badge trạng thái show
const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-green-500/10 text-success border-green-500/20',
    ongoing: 'bg-blue-500/10 text-sky-700 border-blue-500/20',
    draft: 'bg-line-strong/10 text-ink-soft border-line-strong/20',
    ended: 'bg-red-500/10 text-danger border-red-500/20',
    cancelled: 'bg-red-500/10 text-danger border-red-500/20',
  }
  const labels = { published: 'Published', ongoing: 'Ongoing', draft: 'Draft', ended: 'Ended', cancelled: 'Cancelled' }
  const key = status ? status.toLowerCase() : 'draft'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[key] || styles.draft}`}>
      {labels[key] || status}
    </span>
  )
}

const AllShowsTab = () => {
  const [shows, setShows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = { 
          page: pagination.page, 
          pageSize: 10, 
          includeSoldOut: true,
          // LƯU Ý: nếu BE hỗ trợ param keyword/searchText cho API này thì thêm vào đây
        }
        const res = await getShows(params)
        if (res.success) {
          setShows(res.data.items)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        }
      } catch (err) {
        toast.error('Không thể tải danh sách chương trình')
      } finally {
        setIsLoading(false)
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [pagination.page])

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchQuery])

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between p-4 border-t border-line">
        <p className="text-sm text-ink-mute">Page {pagination.page} / {pagination.totalPages} (Total: {pagination.totalCount} show)</p>
        <div className="flex gap-2">
          <button 
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} 
            disabled={pagination.page === 1} 
            className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} 
            disabled={pagination.page === pagination.totalPages} 
            className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Ô search (lọc client-side tạm thời trong trang hiện tại) */}
      <div className="bg-card border border-line rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder="Search current page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50"
          />
        </div>
        <p className="text-sm text-ink-mute whitespace-nowrap">Total: {pagination.totalCount} Show</p>
      </div>

      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-espresso/50 border-b border-line">
              <tr>
                <th className="p-4 text-brand-text font-semibold text-sm">Show name</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Lounge</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Type</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Schedule</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Status</th>
                <th className="p-4 text-brand-text font-semibold text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-ink-mute">
                    <Loader2 size={24} className="mx-auto animate-spin text-brand-text" />
                  </td>
                </tr>
              ) : shows.filter(s => 
                  !searchQuery.trim() || 
                  s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.loungeName?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length > 0 ? (
                shows
                  .filter(s => 
                    !searchQuery.trim() || 
                    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.loungeName?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(show => (
                  <tr key={show.id} className="border-b border-line hover:bg-card/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={show.coverImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${show.name || 'Show'}&backgroundColor=1f2937`} 
                          alt={show.name} 
                          className="w-10 h-10 rounded-lg object-cover border border-line"
                        />
                        <p className="text-sm text-ink font-medium">{show.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-ink-soft text-sm">{show.loungeName}</td>
                    <td className="p-4"><FormatBadge format={show.format} /></td>
                    <td className="p-4 text-ink-soft text-sm">{dayjs(show.scheduledStart).format('HH:mm DD/MM/YYYY')}</td>
                    <td className="p-4"><StatusBadge status={show.status} /></td>
                    <td className="p-4 text-right">
                      <Link 
                        to={`/admin/shows/${show.id}`} 
                        className="inline-flex items-center gap-1.5 text-brand-text border border-brand/30 hover:bg-brand-hover/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        View detail
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-ink-mute">
                    <Music2 size="32" className="mx-auto mb-3 opacity-50" />
                    Show not found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>
    </div>
  )
}

export default AllShowsTab