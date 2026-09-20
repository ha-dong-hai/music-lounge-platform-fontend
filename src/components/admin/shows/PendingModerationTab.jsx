import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, X, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getPendingModerations, reviewLivestreamModeration } from '../../../services/adminServices'

// Vòng tròn điểm AI (0 -> 100)
const AIScoreCircle = ({ score }) => {
  if (score === null || score === undefined) return <div className="text-gray-600 text-sm">N/A</div>
  const numScore = Math.round(score * 100)
  const colorClass = numScore >= 70 ? 'border-green-500 text-green-400' : numScore >= 40 ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'
  return (
    <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-sm ${colorClass}`}>
      {numScore}
    </div>
  )
}

const RiskLevelBadge = ({ level }) => {
  const styles = {
    Low: 'bg-green-500/10 text-green-400 border-green-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const labels = { Low: 'Low', Medium: 'Medium', High: 'High', Critical: 'Critical' }
  if (!level) return <span className="text-xs text-gray-500">Not rated</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[level]}`}>
      {labels[level] || level}
    </span>
  )
}

const PendingModerationTab = () => {
  const [targetType, setTargetType] = useState('Show') // 'Show' | 'Livestream'
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  const fetchPending = async () => {
    setIsLoading(true)
    try {
      const res = await getPendingModerations({ page: pagination.page, pageSize: 10, targetType })
      if (res.success) {
        setItems(res.data.items)
        setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
      }
    } catch {
      toast.error('Không thể tải danh sách chờ duyệt')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [pagination.page, targetType])

  const handleTabChange = (type) => {
    setTargetType(type)
    setPagination({ page: 1, totalPages: 1, totalCount: 0 })
  }

  const handleReviewLivestream = async (livestreamId, decision) => {
    setBusyId(livestreamId)
    try {
      await reviewLivestreamModeration(livestreamId, decision)
      toast.success(decision === 'Approved' ? 'Đã duyệt livestream.' : 'Đã từ chối livestream.')
      fetchPending()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {/* TAB CHỌN LOẠI ĐANG CHỜ DUYỆT */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleTabChange('Show')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${targetType === 'Show' ? 'bg-[#C3B665] text-black' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
        >
          Show
        </button>
        <button
          onClick={() => handleTabChange('Livestream')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${targetType === 'Livestream' ? 'bg-[#C3B665] text-black' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
        >
          Livestream
        </button>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/50 border-b border-gray-800">
              <tr>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">{targetType} ({targetType} ID)</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Rick level</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Flag reason</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">AI score</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Deadlin SLA</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">
                    <Loader2 size={24} className="mx-auto animate-spin text-[#C3B665]" />
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map(item => (
                  <tr key={item.id} className="border-b border-gray-900 hover:bg-gray-900/50 transition-colors">
                    <td className="p-4 text-white font-medium">
                      {targetType} #{item.targetId}
                      <p className="text-xs text-gray-500 mt-1">Created: {dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')}</p>
                    </td>
                    <td className="p-4"><RiskLevelBadge level={item.riskLevel} /></td>
                    <td className="p-4">
                      {item.flagReason ? (
                        <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                          <AlertTriangle size={12} /> {item.flagReason}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600">None</p>
                      )}
                    </td>
                    <td className="p-4"><AIScoreCircle score={item.aiScore} /></td>
                    <td className="p-4 text-gray-400 whitespace-nowrap text-sm">
                      {item.slaDeadline ? dayjs(item.slaDeadline).format('HH:mm DD/MM') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      {targetType === 'Show' ? (
                        <Link
                          to={`/admin/shows/${item.targetId}`}
                          className="inline-flex items-center gap-1.5 bg-[#C3B665] text-black px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#d4c87f] transition-colors"
                        >
                          <Eye size={14} /> Review
                        </Link>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReviewLivestream(item.targetId, 'Approved')}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/40 text-green-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-500/20 disabled:opacity-50"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleReviewLivestream(item.targetId, 'Rejected')}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/40 text-red-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <Check size={32} className="mx-auto mb-3 text-green-500/50" />
                    No programs were flagged. The system has reviewed everything!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!isLoading && items.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">Page {pagination.page} / {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PendingModerationTab
