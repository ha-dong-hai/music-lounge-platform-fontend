import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, X, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getPendingModerations, reviewLivestreamModeration, reviewTicketTier } from '../../../services/adminServices'
import { FormatBadge } from './ShowBadges'

// Vòng tròn điểm AI (0 -> 100)
const AIScoreCircle = ({ score }) => {
  if (score === null || score === undefined) return <div className="text-ink-mute text-sm">N/A</div>
  const numScore = Math.round(score * 100)
  const colorClass = numScore >= 70 ? 'border-success text-success' : numScore >= 40 ? 'border-warning text-warning' : 'border-danger text-danger'
  return (
    <div className={`w-10 h-10 flex items-center justify-center border-2 font-bold text-sm ${colorClass}`}>
      {numScore}
    </div>
  )
}

const RiskLevelBadge = ({ level }) => {
  const styles = {
    Low: 'bg-success/10 text-success border-success/20',
    Medium: 'bg-warning/10 text-warning border-warning/20',
    High: 'bg-warning/10 text-warning border-warning/20',
    Critical: 'bg-danger/10 text-danger border-danger/20',
  }
  const labels = { Low: 'Low', Medium: 'Medium', High: 'High', Critical: 'Critical' }
  if (!level) return <span className="text-xs text-ink-mute">Chưa chấm</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${styles[level]}`}>
      {labels[level] || level}
    </span>
  )
}

const PendingModerationTab = () => {
  const [targetType, setTargetType] = useState('Show') // 'Show' | 'Livestream' | 'TicketTier'
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

  // Duyệt HẠNG VÉ. Hạng vé chưa duyệt KHÔNG được tính vào khoảng giá hiện trên thẻ buổi diễn,
  // nên bỏ quên hàng đợi này là vé của chủ phòng trà không bán được mà họ không hiểu vì sao.
  const handleReviewTier = async (tierId, decision) => {
    setBusyId(tierId)
    try {
      await reviewTicketTier(tierId, decision)
      toast.success(decision === 'Approved' ? 'Đã duyệt hạng vé.' : 'Đã từ chối hạng vé.')
      await fetchPending()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được hạng vé.')
    } finally {
      setBusyId(null)
    }
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
          className={`px-4 py-2 text-sm font-bold transition-colors ${targetType === 'Show' ? 'bg-ink text-lamp' : 'bg-card text-ink-soft hover:text-ink'}`}
        >
          Show
        </button>
        <button
          onClick={() => handleTabChange('Livestream')}
          className={`px-4 py-2 text-sm font-bold transition-colors ${targetType === 'Livestream' ? 'bg-ink text-lamp' : 'bg-card text-ink-soft hover:text-ink'}`}
        >
          Livestream
        </button>
        <button
          onClick={() => handleTabChange('TicketTier')}
          className={`px-4 py-2 text-sm font-bold transition-colors ${targetType === 'TicketTier' ? 'bg-ink text-lamp' : 'bg-card text-ink-soft hover:text-ink'}`}
        >
          Hạng vé
        </button>
      </div>

      <div className="bg-card border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-sunken/80 border-b border-line">
              <tr>
                <th className="p-4 text-ink font-semibold text-sm">{targetType} ({targetType} ID)</th>
                <th className="p-4 text-ink font-semibold text-sm">Mức rủi ro</th>
                <th className="p-4 text-ink font-semibold text-sm">Lý do gắn cờ</th>
                <th className="p-4 text-ink font-semibold text-sm">Điểm AI</th>
                <th className="p-4 text-ink font-semibold text-sm">Hạn duyệt</th>
                <th className="p-4 text-ink font-semibold text-sm text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-ink-mute">
                    <Loader2 size={24} className="mx-auto animate-spin text-ink" />
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map(item => (
                  <tr key={item.id} className="border-b border-line hover:bg-card/50 transition-colors">
                    <td className="p-4 text-ink font-medium">
                      {targetType} #{item.targetId}
                      <p className="text-xs text-ink-mute mt-1">Created: {dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')}</p>
                    </td>
                    <td className="p-4"><FormatBadge format={item.format} /></td>
                    <td className="p-4"><RiskLevelBadge level={item.riskLevel} /></td>
                    <td className="p-4">
                      {item.flagReason ? (
                        <p className="text-xs text-warning flex items-center gap-1.5">
                          <AlertTriangle size={12} /> {item.flagReason}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-mute">Không có</p>
                      )}
                    </td>
                    <td className="p-4"><AIScoreCircle score={item.aiScore} /></td>
                    <td className="p-4 text-ink-soft whitespace-nowrap text-sm">
                      {item.slaDeadline ? dayjs(item.slaDeadline).format('HH:mm DD/MM') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      {targetType === 'TicketTier' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReviewTier(item.targetId, 'Approved')}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 bg-success/10 border border-success/40 text-success px-3 py-1.5 rounded-md text-xs font-bold hover:bg-success/20 disabled:opacity-50"
                          >
                            <Check size={14} /> Duyệt
                          </button>
                          <button
                            onClick={() => handleReviewTier(item.targetId, 'Rejected')}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 bg-danger/10 border border-danger/40 text-danger px-3 py-1.5 rounded-md text-xs font-bold hover:bg-danger/20 disabled:opacity-50"
                          >
                            <X size={14} /> Từ chối
                          </button>
                        </div>
                      ) : targetType === 'Show' ? (
                        <Link
                          to={`/admin/shows/${item.targetId}`}
                          className="inline-flex items-center gap-1.5 bg-ink text-lamp px-3 py-1.5 rounded-md text-xs font-bold hover:bg-board transition-colors"
                        >
                          <Eye size={14} /> Review
                        </Link>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReviewLivestream(item.targetId, 'Approved')}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 bg-success/10 border border-success/40 text-success px-3 py-1.5 rounded-md text-xs font-bold hover:bg-success/20 disabled:opacity-50"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleReviewLivestream(item.targetId, 'Rejected')}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 bg-danger/10 border border-danger/40 text-danger px-3 py-1.5 rounded-md text-xs font-bold hover:bg-danger/20 disabled:opacity-50"
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
                  <td colSpan="6" className="p-12 text-center text-ink-mute">
                    <Check size={32} className="mx-auto mb-3 text-success/50" />
                    Không có mục nào đang chờ duyệt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!isLoading && items.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-line">
            <p className="text-sm text-ink-mute">Page {pagination.page} / {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-md border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
