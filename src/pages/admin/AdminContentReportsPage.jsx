// src/pages/admin/AdminContentReportsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Hàng đợi này gom theo NỘI DUNG bị báo cáo, không phải theo từng lượt báo cáo: mỗi dòng là 1 nội
//   dung kèm reportCount (bao nhiêu người đã báo) và latestReason. Vì vậy DTO không có id của báo
//   cáo — xử lý là xử lý TẤT CẢ báo cáo đang mở của nội dung đó cùng lúc (targetType + targetId).
// - slaDeadline là hạn gỡ bỏ theo NĐ 147/2024 (mặc định 48h kể từ báo cáo đầu tiên). Dòng quá hạn
//   được tô đỏ để Admin thấy ngay.
// - 4 loại nội dung: Show / Livestream / Rating / ChatMessage. ChatMessage (MLACP-456) là một tin nhắn cụ
//   thể — targetId là mã tin nhắn, targetSummary là nội dung + tên người gửi + giờ gửi. Gỡ thì tin nhắn
//   biến khỏi lịch sử chat và người xem nhận sự kiện SignalR ChatMessageHidden.
// - showId có cho MỌI loại: Show là chính nó; Livestream / ChatMessage / Rating là buổi diễn chứa nó.
//   Dùng nó để mở đúng ngữ cảnh — đừng dùng targetId: với Livestream đó là mã LIVESTREAM, còn route
//   /livestream/:showId nhận mã buổi diễn; hai bảng đánh số riêng nên mã dễ trùng số mà sai buổi.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ShieldAlert, Trash2, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getContentReportQueue, resolveContentReport } from '../../services/contentReportServices'

const TARGET_LABELS = {
  Show: 'Buổi diễn',
  Livestream: 'Livestream',
  Rating: 'Đánh giá',
  ChatMessage: 'Tin nhắn chat',
}

// Link mở nội dung bị báo cáo trong đúng ngữ cảnh của nó. Show dự phòng về targetId (với Show hai mã
// là một) để không mất link khi backend chưa trả showId; các loại khác không có showId thì không link.
const contentLink = (item) => {
  switch (item.targetType) {
    case 'Show':
      return `/shows/${item.showId ?? item.targetId}`
    case 'Rating':
      return item.showId != null ? `/shows/${item.showId}` : null
    case 'Livestream':
    case 'ChatMessage':
      return item.showId != null ? `/livestream/${item.showId}` : null
    default:
      return null
  }
}

const AdminContentReportsPage = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyKey, setBusyKey] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  const fetchQueue = useCallback(async (page) => {
    setIsLoading(true)
    try {
      const res = await getContentReportQueue({ page, pageSize: 20 })
      if (res.success) {
        setItems(res.data.items)
        setPagination((prev) => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
      }
    } catch {
      toast.error('Không tải được hàng đợi báo cáo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const run = async () => { await fetchQueue(pagination.page) }
    run()
  }, [fetchQueue, pagination.page])

  const handleResolve = async (item, action) => {
    const key = `${item.targetType}-${item.targetId}`
    setBusyKey(key)
    try {
      await resolveContentReport({ targetType: item.targetType, targetId: item.targetId, action })
      toast.success(action === 'Removed' ? 'Đã gỡ nội dung.' : 'Đã bỏ qua báo cáo.')
      await fetchQueue(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xử lý thất bại.')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink mb-1">Báo cáo vi phạm</h1>
        <p className="text-ink-soft text-sm">
          Nội dung đã đăng bị người dùng báo cáo. Nội dung bị nhiều người báo nhất xếp lên đầu.
        </p>
      </div>

      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-espresso/50 border-b border-line">
              <tr>
                <th className="p-4 text-brand-text font-semibold text-sm">Nội dung bị báo cáo</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Số lượt báo</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Lý do gần nhất</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Hạn xử lý</th>
                <th className="p-4 text-brand-text font-semibold text-sm text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center">
                    <Loader2 size={24} className="mx-auto animate-spin text-brand-text" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-ink-mute">
                    <CheckCircle2 size={32} className="mx-auto mb-3 text-success/50" />
                    Không có nội dung nào đang bị báo cáo.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const key = `${item.targetType}-${item.targetId}`
                  const isOverdue = item.slaDeadline && dayjs(item.slaDeadline).isBefore(dayjs())
                  const isBusy = busyKey === key
                  return (
                    <tr key={key} className="border-b border-line hover:bg-card/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs font-medium">
                            {TARGET_LABELS[item.targetType] || item.targetType}
                          </span>
                          {contentLink(item) ? (
                            <Link to={contentLink(item)} className="text-ink font-medium hover:text-brand-text transition-colors">
                              {item.targetSummary}
                            </Link>
                          ) : (
                            <span className="text-ink font-medium">{item.targetSummary}</span>
                          )}
                        </div>
                        <p className="text-xs text-ink-mute mt-1">
                          Báo cáo đầu tiên: {dayjs(item.earliestReportedAt).format('HH:mm DD/MM/YYYY')}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-danger border border-red-500/20 text-xs font-bold">
                          <ShieldAlert size={12} /> {item.reportCount}
                        </span>
                      </td>
                      <td className="p-4 max-w-md">
                        <p className="text-xs text-ink-soft whitespace-normal line-clamp-2">{item.latestReason}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-danger' : 'text-ink-soft'}`}>
                          <Clock size={12} />
                          {item.slaDeadline ? dayjs(item.slaDeadline).format('HH:mm DD/MM') : '-'}
                          {isOverdue && ' (quá hạn)'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResolve(item, 'Removed')}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/40 text-danger px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Gỡ nội dung
                          </button>
                          <button
                            onClick={() => handleResolve(item, 'Dismissed')}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 bg-sunken border border-line text-ink-soft px-3 py-1.5 rounded-md text-xs font-bold hover:bg-line disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} /> Bỏ qua
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && items.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-line">
            <p className="text-sm text-ink-mute">Trang {pagination.page} / {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

export default AdminContentReportsPage
