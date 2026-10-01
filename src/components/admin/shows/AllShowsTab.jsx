import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight, Music2, Search } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getShows } from '../../../services/showServices'
// Badge dùng chung — bản sao riêng trước đây ở file này in trạng thái bằng tiếng Anh (Published/Ongoing…).
import { FormatBadge, StatusBadge } from './ShowBadges'
import { anhChuCai } from '../../../utils/anhChuCai'

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
      } catch {
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
        <p className="text-sm text-ink-mute">Trang {pagination.page} / {pagination.totalPages} · {pagination.totalCount} buổi diễn</p>
        <div className="flex gap-2">
          <button 
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} 
            disabled={pagination.page === 1} 
            className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Trang trước">
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} 
            disabled={pagination.page === pagination.totalPages} 
            className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Trang sau">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Ô search (lọc client-side tạm thời trong trang hiện tại) */}
      <div className="bg-card border border-line p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input aria-label="Tìm trong trang hiện tại"
            type="text"
            placeholder="Tìm trong trang hiện tại…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-page border border-line text-sm text-ink focus:outline-none focus:border-ink/50"
          />
        </div>
        <p className="text-sm text-ink-mute whitespace-nowrap">Tổng: {pagination.totalCount} buổi diễn</p>
      </div>

      <div className="bg-card border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-sunken border-b-2 border-ink">
              <tr>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Tên buổi diễn</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Phòng trà</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Hình thức</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Lịch diễn</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Trạng thái</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-ink-mute">
                    <Loader2 size={24} className="mx-auto animate-spin text-ink" />
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
                          src={show.coverImageUrl || anhChuCai(show.name || 'Show')} 
                          alt={show.name} 
                          className="w-10 h-10 object-cover border border-line"
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
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-ink-mute">
                    <Music2 size="32" className="mx-auto mb-3 opacity-50" />
                    Không tìm thấy buổi diễn nào.
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