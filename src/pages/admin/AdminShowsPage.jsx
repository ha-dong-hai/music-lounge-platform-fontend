// src/pages/admin/AdminShowsPage.jsx
import { useState, useEffect, useMemo } from 'react'
import { Search, ArrowUpDown, Building, Radio, Cast, Eye, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { showService } from '../../services/showService'
import dayjs from 'dayjs'

const AdminShowsPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [shows, setShows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  // Fetch shows from API
  useEffect(() => {
    const fetchShows = async () => {
      setIsLoading(true)
      try {
        const res = await showService.getPublished({ page: 1, pageSize: 100, sortBy: 'Newest', includeSoldOut: true })
        if (res?.success) {
          setShows(res.data?.items || [])
        }
      } catch (err) {
        console.error('Failed to fetch shows:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchShows()
  }, [])

  // Map BE show format to display format
  const mappedShows = useMemo(() => shows.map(s => ({
    id: s.id,
    title: s.name,
    lounge: s.loungeName || s.lounge?.name || '',
    date: s.scheduledStart,
    status: s.status?.toLowerCase() === 'published' ? 'approved' : s.status?.toLowerCase() === 'draft' ? 'pending_manual' : s.status?.toLowerCase() === 'cancelled' ? 'rejected' : 'approved',
    aiScore: Math.floor(Math.random() * 40 + 60), // BE doesn't have AI score yet
    flagReason: null,
    eventType: (s.format || 'Offline').toLowerCase(),
    genre: s.genres?.[0]?.name || '',
  })), [shows])

  const processedShows = useMemo(() => {
    let result = [...mappedShows]
    if (searchQuery.trim() !== '') {
      result = result.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lounge.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus)
    }
    if (filterType !== 'all') {
      result = result.filter(s => s.eventType === filterType)
    }

    result.sort((a, b) => {
      if (sortBy === 'date_desc') return dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
      if (sortBy === 'date_asc') return dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
      if (sortBy === 'ai_desc') return b.aiScore - a.aiScore
      if (sortBy === 'ai_asc') return a.aiScore - b.aiScore
      return 0
    })
    return result
  }, [mappedShows, searchQuery, filterStatus, filterType, sortBy])

  const pendingShows = mappedShows.filter(s => s.status === 'pending_manual' || s.status === 'rejected')

  const renderStatusTag = (status) => {
    if (status === 'approved') return <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs">Đã duyệt</span>
    if (status === 'pending_manual') return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs">Chờ duyệt</span>
    if (status === 'rejected') return <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs">Từ chối</span>
    return null
  }

  const renderEventType = (type) => {
    const styles = {
      offline: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
      livestream: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      online: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      hybrid: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }
    const icons = {
      offline: <Building size={12} />,
      livestream: <Radio size={12} />,
      online: <Radio size={12} />,
      hybrid: <Cast size={12} />,
    }
    const labels = { offline: 'Offline', livestream: 'Livestream', online: 'Online', hybrid: 'Hybrid' }
    const t = (type || 'offline').toLowerCase()
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${styles[t] || styles.offline}`}>
        {icons[t] || icons.offline}
        {labels[t] || type}
      </span>
    )
  }

  const renderAIScoreCircle = (score) => {
    const colorClass = score >= 70 ? 'border-green-500 text-green-400' : score >= 40 ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'
    return (
      <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-sm ${colorClass}`}>
        {score}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Quản lý Chương trình Âm nhạc</h1>
      <p className="text-gray-400 mb-6 text-sm">Quản lý tất cả các chương trình trên nền tảng.</p>

      <div className="mb-6 border-b border-gray-800">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('all')} className={`pb-4 text-base font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>
            Danh sách chương trình ({mappedShows.length})
          </button>
          <button onClick={() => setActiveTab('pending')} className={`pb-4 text-base font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>
            Cần duyệt
            {pendingShows.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingShows.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'all' && (
        <div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Tìm tên show hoặc phòng trà..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 transition-colors" />
            </div>

            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-[#C3B665]/50 cursor-pointer">
              <option value="all">Tất cả loại hình</option>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-[#C3B665]/50 cursor-pointer">
              <option value="all">Tất cả trạng thái</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending_manual">Chờ duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>

            <div className="relative">
              <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-[#C3B665]/50 cursor-pointer appearance-none">
                <option value="date_desc">Ngày (Mới nhất)</option>
                <option value="date_asc">Ngày (Cũ nhất)</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-black/50 border-b border-gray-800">
                <tr>
                  <th className="p-4 text-[#C3B665] font-semibold text-sm">Tên chương trình</th>
                  <th className="p-4 text-[#C3B665] font-semibold text-sm">Phòng trà</th>
                  <th className="p-4 text-[#C3B665] font-semibold text-sm">Loại hình</th>
                  <th className="p-4 text-[#C3B665] font-semibold text-sm">Thời gian</th>
                  <th className="p-4 text-[#C3B665] font-semibold text-sm">Trạng thái</th>
                  <th className="p-4 text-[#C3B665] font-semibold text-sm text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {processedShows.length > 0 ? (
                  processedShows.map(show => (
                    <tr key={show.id} className="border-b border-gray-900 hover:bg-gray-900/50 transition-colors">
                      <td className="p-4 text-white font-medium">{show.title}</td>
                      <td className="p-4 text-gray-400">{show.lounge}</td>
                      <td className="p-4">{renderEventType(show.eventType)}</td>
                      <td className="p-4 text-gray-400 whitespace-nowrap">{show.date ? dayjs(show.date).format('HH:mm DD/MM/YYYY') : 'N/A'}</td>
                      <td className="p-4">{renderStatusTag(show.status)}</td>
                      <td className="p-4 text-right">
                        <Link to={`/admin/shows/${show.id}`} className="inline-flex items-center gap-1.5 text-[#C3B665] border border-[#C3B665]/30 hover:bg-[#C3B665]/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors">
                          <Eye size={14} /> Xem chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Không tìm thấy chương trình nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/50 border-b border-gray-800">
              <tr>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Tên chương trình</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Loại hình</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingShows.length > 0 ? (
                pendingShows.map(show => (
                  <tr key={show.id} className="border-b border-gray-900 hover:bg-gray-900/50 transition-colors">
                    <td className="p-4">
                      <p className="text-white font-medium mb-1">{show.title}</p>
                      {show.flagReason && (
                        <p className="text-xs flex items-center gap-1.5 text-yellow-400">
                          <AlertTriangle size={12} /> {show.flagReason}
                        </p>
                      )}
                    </td>
                    <td className="p-4">{renderEventType(show.eventType)}</td>
                    <td className="p-4 text-right">
                      <Link to={`/admin/shows/${show.id}`} className="inline-flex items-center gap-1.5 bg-[#C3B665] text-black px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#d4c87f] transition-colors">
                        <Eye size={14} /> Xem & Xử lý
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="p-12 text-center text-gray-500"><Check size={32} className="mx-auto mb-3 text-green-500/50" />Không có chương trình nào cần duyệt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminShowsPage