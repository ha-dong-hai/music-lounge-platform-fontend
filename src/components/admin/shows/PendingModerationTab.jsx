import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getPendingModerations } from '../../../services/adminServices'

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
  const labels = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao', Critical: 'Nghiêm trọng' }
  if (!level) return <span className="text-xs text-gray-500">Chưa đánh giá</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[level]}`}>
      {labels[level] || level}
    </span>
  )
}

const PendingModerationTab = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  useEffect(() => {
    const fetchPending = async () => {
      setIsLoading(true)
      try {
        // targetType='Show' theo đúng 4 loại BE hỗ trợ
        const res = await getPendingModerations({ page: pagination.page, pageSize: 10, targetType: 'Show' })
        if (res.success) {
          setItems(res.data.items)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        }
      } catch (err) {
        toast.error('Không thể tải danh sách chờ duyệt')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPending()
  }, [pagination.page])

  return (
    <div>
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/50 border-b border-gray-800">
              <tr>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Đối tượng (Show ID)</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Mức độ rủi ro</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Lý do AI Flag</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Điểm AI</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm">Hạn SLA</th>
                <th className="p-4 text-[#C3B665] font-semibold text-sm text-right">Hành động</th>
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
                      Show #{item.targetId}
                      <p className="text-xs text-gray-500 mt-1">Tạo lúc: {dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')}</p>
                    </td>
                    <td className="p-4"><RiskLevelBadge level={item.riskLevel} /></td>
                    <td className="p-4">
                      {item.flagReason ? (
                        <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                          <AlertTriangle size={12} /> {item.flagReason}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600">Không có</p>
                      )}
                    </td>
                    <td className="p-4"><AIScoreCircle score={item.aiScore} /></td>
                    <td className="p-4 text-gray-400 whitespace-nowrap text-sm">
                      {item.slaDeadline ? dayjs(item.slaDeadline).format('HH:mm DD/MM') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        to={`/admin/shows/${item.targetId}`} 
                        className="inline-flex items-center gap-1.5 bg-[#C3B665] text-black px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#d4c87f] transition-colors"
                      >
                        <Eye size={14} /> Xem & Xử lý
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <Check size={32} className="mx-auto mb-3 text-green-500/50" />
                    Không có chương trình nào bị AI gắn cờ. Hệ thống đã duyệt hết!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!isLoading && items.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">Trang {pagination.page} / {pagination.totalPages}</p>
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