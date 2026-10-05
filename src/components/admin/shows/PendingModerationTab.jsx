import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, X, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import DaCho from '../../bang/DaCho'
import toast from 'react-hot-toast'
import HopXacNhan from '../../shared/HopXacNhan'
import { getPendingModerations, reviewLivestreamModeration, reviewTicketTier } from '../../../services/adminServices'
import { FormatBadge } from './ShowBadges'
import NhomTab from '../../bang/NhomTab'

// Vòng tròn điểm AI (0 -> 100)
const AIScoreCircle = ({ score }) => {
  if (score === null || score === undefined) return <div className="text-ink-mute text-sm">Chưa chấm</div>
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

  useEffect(() => { const chay = async () => { await fetchPending() }; chay() }, [pagination.page, targetType]) // eslint-disable-line react-hooks/exhaustive-deps -- fetchPending tạo mới mỗi lần vẽ; đổi sang useCallback là việc riêng

  const handleTabChange = (type) => {
    setTargetType(type)
    setPagination({ page: 1, totalPages: 1, totalCount: 0 })
  }

  // Duyệt HẠNG VÉ. Hạng vé chưa duyệt KHÔNG được tính vào khoảng giá hiện trên thẻ buổi diễn,
  // nên bỏ quên hàng đợi này là vé của chủ phòng trà không bán được mà họ không hiểu vì sao.
  // SỬA 01/10/2026: Review{TicketTier,Livestream}CommandValidator BẮT BUỘC ReviewNote khi Rejected ("Phải ghi lý do khi
  // từ chối"), nhưng bản cũ gọi service với reviewNote mặc định '' → nút Từ chối LUÔN trả 400, Admin không từ chối được
  // hạng vé hay buổi phát nào. Lý do được gửi nguyên văn cho chủ phòng trà (NotifyAsync trong hai handler). Nay Từ chối
  // mở HopXacNhan có ô lý do bắt buộc.
  const [tuChoi, setTuChoi] = useState(null) // { loai: 'tier' | 'ls', id }
  const [lyDo, setLyDo] = useState('')
  const [loiLyDo, setLoiLyDo] = useState(null)
  const guiTuChoi = async () => {
    if (!lyDo.trim()) { setLoiLyDo('Ghi lý do — chủ phòng trà đọc đúng câu này để sửa.'); return }
    const { loai, id } = tuChoi
    if (loai === 'tier') await handleReviewTier(id, 'Rejected', lyDo.trim())
    else await handleReviewLivestream(id, 'Rejected', lyDo.trim())
    setTuChoi(null)
  }

  const handleReviewTier = async (tierId, decision, note = '') => {
    setBusyId(tierId)
    try {
      await reviewTicketTier(tierId, decision, note)
      toast.success(decision === 'Approved' ? 'Đã duyệt hạng vé.' : 'Đã từ chối hạng vé.')
      await fetchPending()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được hạng vé.')
    } finally {
      setBusyId(null)
    }
  }

  const handleReviewLivestream = async (livestreamId, decision, note = '') => {
    setBusyId(livestreamId)
    try {
      await reviewLivestreamModeration(livestreamId, decision, note)
      toast.success(decision === 'Approved' ? 'Đã duyệt buổi phát.' : 'Đã từ chối buổi phát.')
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
      {/* NhomTab chung (01/10/2026): bản cũ cao ~36px, chữ tiếng Anh "Show"/"Livestream", không báo tab đang chọn.
          Chạy thật luồng Mux mới mở tới tab này nên bản quét chất lượng (chỉ mở tab mặc định) không thấy. */}
      <NhomTab className="mb-4" nhan="Loại nội dung chờ duyệt" dangChon={targetType} onChon={handleTabChange}
        cacTab={[{ khoa: 'Show', nhan: 'Buổi diễn' }, { khoa: 'Livestream', nhan: 'Buổi phát' }, { khoa: 'TicketTier', nhan: 'Hạng vé' }]} />

      <div className="bg-card border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-sunken border-b-2 border-ink">
              <tr>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">{targetType} ({targetType} ID)</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Mức rủi ro</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Lý do gắn cờ</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Điểm AI</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Hạn duyệt</th>
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
              ) : items.length > 0 ? (
                items.map(item => (
                  <tr key={item.id} className="border-b border-line hover:bg-card/50 transition-colors">
                    <td className="p-4 text-ink font-medium">
                      {/* MLACP-672: backend trả tên (hạng vé/buổi phát đã kèm loại); buổi diễn chỉ là tên nên thêm loại ở đây. */}
                      {item.targetName ? (targetType === 'Show' ? `Buổi diễn: ${item.targetName}` : item.targetName) : '(không còn tồn tại)'}
                      <p className="text-xs text-ink-mute mt-1">Tạo lúc {dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')}</p>
                      <DaCho luc={item.createdAt} han={item.slaDeadline} className="mt-1" />
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
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => handleReviewTier(item.targetId, 'Approved')}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-success bg-card text-success text-sm font-semibold hover:bg-success hover:text-lamp"
                          >
                            <Check size={14} /> Duyệt
                          </button>
                          <button
                            type="button" onClick={() => { setLyDo(''); setLoiLyDo(null); setTuChoi({ loai: 'tier', id: item.targetId, ten: item.targetName }) }}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-danger bg-card text-danger text-sm font-semibold hover:bg-danger hover:text-lamp"
                          >
                            <X size={14} /> Từ chối
                          </button>
                        </div>
                      ) : targetType === 'Show' ? (
                        <Link
                          to={`/admin/shows/${item.targetId}`} state={{ fromModeration: true }}
                          className="inline-flex items-center gap-1.5 justify-center min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board"
                        >
                          <Eye size={14} aria-hidden="true" /> Xem và duyệt
                        </Link>
                      ) : (
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => handleReviewLivestream(item.targetId, 'Approved')}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-success bg-card text-success text-sm font-semibold hover:bg-success hover:text-lamp"
                          >
                            <Check size={14} aria-hidden="true" /> Duyệt
                          </button>
                          <button
                            type="button" onClick={() => { setLyDo(''); setLoiLyDo(null); setTuChoi({ loai: 'ls', id: item.targetId, ten: item.targetName }) }}
                            disabled={busyId === item.targetId}
                            className="inline-flex items-center gap-1.5 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-danger bg-card text-danger text-sm font-semibold hover:bg-danger hover:text-lamp"
                          >
                            <X size={14} aria-hidden="true" /> Từ chối
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
        )}
      </div>
      <HopXacNhan mo={!!tuChoi} dangXuLy={busyId != null} nhanGiu="Không, quay lại"
        tieuDe={`Từ chối ${tuChoi?.ten || (tuChoi?.loai === 'tier' ? 'hạng vé này' : 'buổi phát này')}?`}
        nhanXacNhan="Từ chối" onDong={() => setTuChoi(null)} onXacNhan={guiTuChoi}>
        <label htmlFor="ly-do-tu-choi" className="block font-semibold text-ink">Lý do <span className="text-danger" aria-hidden="true">*</span><span className="sr-only"> (bắt buộc)</span></label>
        <p id="ly-do-tu-choi-goi-y" className="text-sm">Gửi nguyên văn cho chủ phòng trà.</p>
        <textarea id="ly-do-tu-choi" rows={3} maxLength={1000} value={lyDo} onChange={(e) => { setLyDo(e.target.value); setLoiLyDo(null) }}
          aria-invalid={loiLyDo ? 'true' : undefined} aria-describedby={`ly-do-tu-choi-goi-y${loiLyDo ? ' ly-do-tu-choi-loi' : ''}`}
          className={`mt-1 w-full px-3 py-2 bg-card border-2 text-ink resize-none focus:outline-none focus:ring-2 focus:ring-ink ${loiLyDo ? 'border-danger' : 'border-ink'}`} />
        {loiLyDo && <p id="ly-do-tu-choi-loi" className="mt-1 text-sm font-semibold text-danger">{loiLyDo}</p>}
      </HopXacNhan>
    </div>
  )
}

export default PendingModerationTab
