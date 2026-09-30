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
//
// SỬA 01/10/2026 — "Gỡ nội dung" từng chạy NGAY ở lần bấm đầu, trong khi (ResolveContentReportCommandHandler.TakeDownAsync):
//   Show        → HUỶ buổi diễn, huỷ mọi vé Confirmed, tạo yêu cầu hoàn 100% cho từng người mua và báo từng người;
//   Livestream  → cắt sóng VĨNH VIỄN (Terminated, chỉ khi đang phát); Rating / ChatMessage → ẩn.
// Nay qua HopXacNhan nói đúng hậu quả theo loại, và gửi `note` (backend có nhận nhưng giao diện chưa từng gửi — người xem
// buổi phát bị cắt chỉ thấy câu mặc định). "Bỏ qua" vẫn một lần bấm: nó chỉ đóng báo cáo, không đụng nội dung hay tiền.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ShieldAlert, Trash2, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getContentReportQueue, resolveContentReport } from '../../services/contentReportServices'
import HopXacNhan from '../../components/shared/HopXacNhan'

const HAU_QUA = {
  Show: 'Buổi diễn bị HUỶ: mọi vé đã bán bị huỷ, hệ thống tạo yêu cầu hoàn 100% tiền vé cho từng người mua và báo cho họ.',
  Livestream: 'Buổi phát bị cắt sóng VĨNH VIỄN (chỉ làm được khi đang phát); người đang xem bị ngắt và thấy ghi chú bên dưới làm lý do.',
  Rating: 'Đánh giá bị ẩn khỏi trang buổi diễn.',
  ChatMessage: 'Tin nhắn bị ẩn khỏi lịch sử trò chuyện của mọi người xem.',
}

const TARGET_LABELS = {
  Show: 'Buổi diễn',
  Livestream: 'Buổi phát trực tuyến',
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
  const [goChon, setGoChon] = useState(null) // nội dung đang chờ xác nhận gỡ
  const [ghiChu, setGhiChu] = useState('')
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
      await resolveContentReport({ targetType: item.targetType, targetId: item.targetId, action, note: action === 'Removed' ? ghiChu.trim() || null : null })
      toast.success(action === 'Removed' ? 'Đã gỡ nội dung.' : 'Đã bỏ qua báo cáo.')
      setGoChon(null)
      setGhiChu('')
      await fetchQueue(pagination.page)
    } catch (err) {
      setGoChon(null)
      toast.error(err.response?.data?.message || 'Xử lý thất bại.', { duration: 10000 })
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl text-ink mb-1">Báo cáo vi phạm</h1>
        <p className="text-ink-soft text-sm">
          Nội dung đã đăng bị người dùng báo cáo. Nội dung bị nhiều người báo nhất xếp lên đầu.
        </p>
      </div>

      <div className="bg-card border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-sunken border-b-2 border-ink">
              <tr>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Nội dung bị báo cáo</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Số lượt báo</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Lý do gần nhất</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm">Hạn xử lý</th>
                <th scope="col" className="p-4 text-ink font-semibold text-sm text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center">
                    <Loader2 size={24} className="mx-auto animate-spin text-ink" />
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
                            <Link to={contentLink(item)} className="text-ink font-medium hover:text-ink transition-colors">
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-danger/10 text-danger border border-danger/20 text-xs font-bold">
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
                            type="button" onClick={() => { setGhiChu(''); setGoChon(item) }}
                            disabled={isBusy} aria-label={`${item.targetType === 'Show' ? 'Huỷ buổi diễn' : 'Gỡ'}: ${item.targetSummary}`}
                            className="inline-flex items-center gap-1.5 min-h-[44px] border-2 border-danger text-danger px-3 text-sm font-semibold hover:bg-danger hover:text-lamp disabled:opacity-50"
                          >
                            <Trash2 size={14} aria-hidden="true" /> {item.targetType === 'Show' ? 'Huỷ buổi diễn' : 'Gỡ'}
                          </button>
                          <button
                            type="button" onClick={() => handleResolve(item, 'Dismissed')}
                            disabled={isBusy} aria-label={`Bỏ qua báo cáo: ${item.targetSummary}`}
                            className="inline-flex items-center gap-1.5 min-h-[44px] border-2 border-ink px-3 text-sm font-semibold hover:bg-ink hover:text-lamp disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} aria-hidden="true" /> Bỏ qua
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
                className="p-2 rounded-md border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Trang trước">
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Trang sau">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <HopXacNhan mo={!!goChon} dangXuLy={busyKey != null} nhanGiu="Không, quay lại"
        tieuDe={goChon?.targetType === 'Show' ? 'Huỷ buổi diễn này?' : `Gỡ ${(TARGET_LABELS[goChon?.targetType] ?? 'nội dung').toLowerCase()} này?`}
        nhanXacNhan={goChon?.targetType === 'Show' ? 'Huỷ buổi diễn và hoàn tiền' : 'Gỡ'}
        onDong={() => setGoChon(null)} onXacNhan={() => handleResolve(goChon, 'Removed')}>
        {goChon && (
          <>
            <p className="font-semibold text-ink break-words">{goChon.targetSummary}</p>
            <p className="mt-2">{HAU_QUA[goChon.targetType]} Mọi báo cáo đang mở của nội dung này được đóng cùng lúc. Không hoàn tác được.</p>
            <label htmlFor="ghi-chu-go" className="block mt-4 font-semibold text-ink">Ghi chú <span className="font-normal text-ink-mute">(không bắt buộc)</span></label>
            <textarea id="ghi-chu-go" rows={2} maxLength={500} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-card border-2 border-ink text-ink resize-none focus:outline-none focus:ring-2 focus:ring-ink" />
          </>
        )}
      </HopXacNhan>
    </div>
  )
}

export default AdminContentReportsPage
