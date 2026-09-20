// src/components/notifications/NotificationBell.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Từ vựng đầy đủ ~20 giá trị referenceType nằm ở backend: NotificationReferenceTypes.cs — mỗi loại ghi
//   rõ referenceId là mã của cái gì. Loại nào chưa có trang phía FE thì cố tình KHÔNG gắn link
//   (payout_owner, kyc_review, security_ip, fnb_order, venue_penalty, ...) để không tạo link chết.
// - Mỗi link phải KHỚP quyền của route nó trỏ tới trong AppRouter.jsx: route không cho vai trò đó vào
//   thì ProtectedRoute đẩy về "/", người dùng bấm thông báo mà ra trang chủ. Đổi quyền route thì sửa ở đây.
// - 'livestream': referenceId là MÃ BUỔI DIỄN từ MLACP-460 (#329); thông báo cũ được migration 464
//   (#334) đổi lại. Trước đó nó là mã LIVESTREAM — nếu thấy link ra sai buổi thì kiểm migration 464 đã chạy chưa.
// - Badge chỉ tải lại khi mở dropdown và lúc mới vào trang (không polling nền) để khỏi gọi API liên tục.
import { useState, useEffect, useCallback } from 'react'
import { Bell, Loader2, CheckCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notificationServices'

// Những loại thông báo dành cho NGƯỜI VẬN HÀNH buổi diễn, không phải cho khán giả.
// Cả hai đều mang referenceType 'show' và referenceId = mã buổi diễn, giống hệt một thông báo
// show thông thường — nên CHỈ có trường `type` phân biệt được, không thể dựa vào referenceType.
// Backend serialize enum ra chuỗi (JsonStringEnumConverter toàn cục), nên so sánh bằng tên là đúng;
// nếu `type` thiếu hoặc lạ thì rơi về đường của khán giả, không vỡ gì.
//
// Hai giá trị dưới đây KHÁC nhau về độ tin cậy, đừng coi là ngang hàng:
//   - 'ModerationResult'       ĐÃ có trên API đang chạy, đã thấy trong dữ liệu thật.
//   - 'PosterGenerationResult' theo PR #326: ĐÃ vào master (đã kiểm code nằm trên master thật,
//     không chỉ nhãn "merged" — vụ #324 từng hiện merged mà code không vào), nhưng chưa thấy trên
//     API thật. Giữ sẵn vì không gây hại: chỉ khớp khi backend thực sự gửi loại đó.
const OPERATOR_SHOW_TYPES = new Set(['ModerationResult', 'PosterGenerationResult'])

const buildLink = (notification, role) => {
  const { type, referenceType, referenceId } = notification
  if (!referenceType || !referenceId) return null

  // Khớp đúng guard trong AppRouter.jsx: cổng /owner cho Owner + Staff, nhưng /owner/shows,
  // /owner/subscription chỉ cho Owner (endpoint của chúng là RequireOwner); chỉ /owner/livestreams
  // cho cả Staff (RequireVenueOperator).
  const isAdmin = role === 'Admin'
  const isOwner = role === 'Owner'
  const canOperateLivestream = role === 'Owner' || role === 'Staff'

  switch (referenceType) {
    case 'show':
      // Chủ nhận kết quả duyệt cần màn vận hành (lý do từ chối, nút sửa, gửi duyệt lại), không phải
      // trang bán vé. Staff không vào được /owner/shows nên rơi về trang công khai.
      return OPERATOR_SHOW_TYPES.has(type) && isOwner
        ? `/owner/shows/${referenceId}`
        : `/shows/${referenceId}`
    case 'livestream':
      // Kết quả duyệt buổi phát, gửi cho người vận hành → về màn vận hành livestream (Staff vào được).
      // Vai trò khác: trang xem, nhận mã buổi diễn — đúng kiểu referenceId từ #329.
      return canOperateLivestream ? '/owner/livestreams' : `/livestream/${referenceId}`
    case 'ticket':
      return `/my-shows/ticket/${referenceId}`
    case 'lounge':
      return `/lounge/${referenceId}`
    // Các màn dưới đây là DANH SÁCH, không có route chi tiết theo id — link về danh sách là đủ để người
    // nhận tìm thấy việc cần làm. Vai trò không có quyền vào thì không gắn link.
    case 'content_report_target':
      return isAdmin ? '/admin/content-reports' : null
    case 'refund_request':
      return isAdmin ? '/admin/refunds' : null
    case 'settlement':
      return isAdmin ? '/admin/settlements' : null
    case 'complaint':
      return isAdmin ? '/admin/complaint' : null
    case 'subscription':
      return isOwner ? '/owner/subscription' : null
    default:
      return null
  }
}

const NotificationBell = () => {
  const role = useAuthStore((s) => s.user?.role)
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const loadUnread = useCallback(async () => {
    try {
      const res = await getUnreadCount()
      if (res.success) setUnread(res.data)
    } catch {
      // Không làm phiền người dùng vì 1 con số badge — im lặng bỏ qua.
    }
  }, [])

  useEffect(() => {
    const init = async () => { await loadUnread() }
    init()
  }, [loadUnread])

  const openAndLoad = async () => {
    const next = !isOpen
    setIsOpen(next)
    if (!next) return
    setIsLoading(true)
    try {
      const res = await getMyNotifications({ pageSize: 15 })
      if (res.success) setItems(res.data.items)
      await loadUnread()
    } catch {
      toast.error('Không tải được thông báo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemClick = async (n) => {
    if (n.isRead) return
    // Cập nhật giao diện trước cho mượt, nhưng nếu API lỗi thì trả lại đúng trạng thái cũ
    // để badge không nói dối (đã đọc trên màn hình mà server vẫn đang tính là chưa đọc).
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)))
    setUnread((c) => Math.max(0, c - 1))
    try {
      await markNotificationRead(n.id)
    } catch {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: false } : i)))
      setUnread((c) => c + 1)
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })))
      setUnread(0)
    } catch {
      toast.error('Không đánh dấu đã đọc được.')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={openAndLoad}
        className="relative flex items-center justify-center w-9 h-9 rounded-full border border-gray-700 hover:border-[#C3B665] text-gray-300 hover:text-[#C3B665] transition-colors"
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-[#1a1a1a] rounded-xl shadow-lg border border-[#C3B665]/20 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 mb-1">
            <p className="text-sm font-semibold text-white">Thông báo</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 text-xs text-[#C3B665] hover:text-white transition-colors"
              >
                <CheckCheck size={14} /> Đánh dấu đã đọc hết
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 size={20} className="animate-spin text-[#C3B665]" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">Chưa có thông báo nào.</p>
            ) : (
              items.map((n) => {
                const link = buildLink(n, role)
                const inner = (
                  <div
                    className={`px-4 py-3 border-b border-gray-800/60 transition-colors hover:bg-gray-800/60 ${n.isRead ? '' : 'bg-[#C3B665]/5'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#C3B665] flex-shrink-0" />}
                      <div className={n.isRead ? 'pl-4' : ''}>
                        <p className={`text-sm ${n.isRead ? 'text-gray-400' : 'text-white font-medium'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-gray-600 mt-1">{dayjs(n.createdAt).format('HH:mm DD/MM/YYYY')}</p>
                      </div>
                    </div>
                  </div>
                )
                return link ? (
                  <Link key={n.id} to={link} onClick={() => { handleItemClick(n); setIsOpen(false) }} className="block">
                    {inner}
                  </Link>
                ) : (
                  <button key={n.id} onClick={() => handleItemClick(n)} className="block w-full text-left">
                    {inner}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

export default NotificationBell
