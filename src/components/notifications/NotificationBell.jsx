// src/components/notifications/NotificationBell.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Luật dẫn đường (referenceType → route, theo vai trò) nằm ở notificationLink.js, dùng chung với
//   trang Thông báo. Đừng chép lại ở đây.
// - Chuông chỉ lấy 15 thông báo mới nhất; xem đủ và phân trang thì ở /notifications.
// - Badge chỉ tải lại khi mở dropdown và lúc mới vào trang (không polling nền) để khỏi gọi API liên tục.
import { useState, useEffect, useCallback } from 'react'
import { Bell, Loader2, CheckCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import { buildLink } from './notificationLink'
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notificationServices'

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
        className="relative flex items-center justify-center w-11 h-11 rounded-full border border-line hover:border-brand text-ink-soft hover:text-brand-text transition-colors"
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
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-card rounded-xl shadow-lift border border-line py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-2 border-b border-line mb-1">
            <p className="text-sm font-semibold text-ink">Thông báo</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 text-xs text-brand-text hover:text-ink transition-colors"
              >
                <CheckCheck size={14} /> Đánh dấu đã đọc hết
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 size={20} className="animate-spin text-brand-text" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-mute">Chưa có thông báo nào.</p>
            ) : (
              items.map((n) => {
                const link = buildLink(n, role)
                const inner = (
                  <div
                    className={`px-4 py-3 border-b border-line/60 transition-colors hover:bg-sunken/60 ${n.isRead ? '' : 'bg-brand/5'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
                      <div className={n.isRead ? 'pl-4' : ''}>
                        <p className={`text-sm ${n.isRead ? 'text-ink-soft' : 'text-ink font-medium'}`}>{n.title}</p>
                        <p className="text-xs text-ink-mute mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-ink-mute mt-1">{dayjs(n.createdAt).format('HH:mm DD/MM/YYYY')}</p>
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

          {/* Chuông chỉ lấy 15 cái mới nhất. Không có lối này thì thông báo thứ 16 trở đi không có
              đường nào xem được — mà đó đúng là chỗ nằm của thứ người dùng cần tra lại về sau. */}
          <Link to="/notifications" onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-center text-xs font-bold text-brand-text hover:bg-sunken/60 border-t border-line">
            Xem tất cả thông báo
          </Link>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

export default NotificationBell
